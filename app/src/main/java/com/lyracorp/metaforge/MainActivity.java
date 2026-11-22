package com.lyracorp.metaforge;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.provider.OpenableColumns;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.util.Base64;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private static final String TAG = "MetaForge";
    private static final int REQ_PICK_FILES = 2001;

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private File modsDir;
    private File downloadsDir;
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final Map<Long, String> downloadMap = new HashMap<>();

    private final BroadcastReceiver downloadReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
            String modId = downloadMap.remove(id);
            if (modId == null) return;
            DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
            DownloadManager.Query q = new DownloadManager.Query();
            q.setFilterById(id);
            try (Cursor c = dm.query(q)) {
                if (c != null && c.moveToFirst()) {
                    int statusIdx = c.getColumnIndex(DownloadManager.COLUMN_STATUS);
                    int localIdx = c.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI);
                    int status = c.getInt(statusIdx);
                    String local = localIdx >= 0 ? c.getString(localIdx) : "";
                    if (status == DownloadManager.STATUS_SUCCESSFUL) {
                        emitDownload(modId, "complete", 100, local, "");
                    } else {
                        emitDownload(modId, "error", 0, local, "Download failed");
                    }
                }
            } catch (Exception e) {
                emitDownload(modId, "error", 0, "", e.getMessage());
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        File base = getExternalFilesDir(null);
        if (base == null) base = getFilesDir();
        modsDir = new File(base, "Mods");
        downloadsDir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "MetaForge");
        if (!modsDir.exists()) modsDir.mkdirs();
        if (!downloadsDir.exists()) downloadsDir.mkdirs();
        seedSamples();

        webView = new WebView(this);
        setContentView(webView);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        }
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = cb;
                try {
                    Intent pick = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                    pick.addCategory(Intent.CATEGORY_OPENABLE);
                    pick.setType("*/*");
                    pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                    pick.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    startActivityForResult(Intent.createChooser(pick, "Add mod files"), REQ_PICK_FILES);
                } catch (Exception e) {
                    cb.onReceiveValue(null);
                    filePathCallback = null;
                }
                return true;
            }
        });
        webView.addJavascriptInterface(new Bridge(), "NativeBridge");
        webView.loadUrl("file:///android_asset/index.html");

                IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(downloadReceiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(downloadReceiver, filter);
        }
    }

    @Override
    protected void onDestroy() {
        try { unregisterReceiver(downloadReceiver); } catch (Exception ignored) {}
        io.shutdownNow();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        webView.evaluateJavascript("(function(){return !!(window.handleBack&&window.handleBack());})()", v -> {
            if (!"true".equals(v)) runOnUiThread(MainActivity.super::onBackPressed);
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_PICK_FILES || filePathCallback == null) return;
        ValueCallback<Uri[]> cb = filePathCallback;
        filePathCallback = null;
        List<Uri> uris = new ArrayList<>();
        if (resultCode == RESULT_OK && data != null) {
            if (data.getClipData() != null) {
                for (int i = 0; i < data.getClipData().getItemCount(); i++) uris.add(data.getClipData().getItemAt(i).getUri());
            } else if (data.getData() != null) uris.add(data.getData());
        }
        List<String> imported = new ArrayList<>();
        for (Uri uri : uris) {
            String name = safeName(displayName(uri));
            try { copyUriToFile(uri, new File(modsDir, name)); imported.add(name); }
            catch (Exception e) { Log.w(TAG, "import failed", e); }
        }
        cb.onReceiveValue(uris.toArray(new Uri[0]));
        StringBuilder arr = new StringBuilder("[");
        for (int i = 0; i < imported.size(); i++) {
            if (i > 0) arr.append(',');
            arr.append('"').append(j(imported.get(i))).append('"');
        }
        arr.append(']');
        webView.evaluateJavascript("window.onModFilesPicked&&window.onModFilesPicked(" + arr + ")", null);
    }

    private void emitDownload(String modId, String state, int progress, String path, String error) {
        String js = "window.onDownloadEvent&&window.onDownloadEvent({modId:\"" + j(modId) + "\",state:\"" + j(state) + "\",progress:" + progress + ",path:\"" + j(path) + "\",error:\"" + j(error) + "\"})";
        runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    private static String j(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }

    private static String safeName(String name) {
        String n = name == null ? "" : new File(name).getName().replaceAll("[\\\\/:*?\"<>|]", "_").trim();
        return n.isEmpty() ? "mod-" + System.currentTimeMillis() + ".bin" : n;
    }

    private String displayName(Uri uri) {
        String name = null;
        try (Cursor c = getContentResolver().query(uri, null, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                int idx = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (idx >= 0) name = c.getString(idx);
            }
        } catch (Exception ignored) {}
        if (name == null && uri.getPath() != null) name = new File(uri.getPath()).getName();
        return name;
    }

    private void copyUriToFile(Uri uri, File dest) throws Exception {
        try (InputStream in = getContentResolver().openInputStream(uri); OutputStream out = new FileOutputStream(dest)) {
            if (in == null) throw new Exception("empty stream");
            byte[] buf = new byte[16384]; int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        }
    }

    private void copyFile(File src, File dst) throws Exception {
        try (InputStream in = new FileInputStream(src); OutputStream out = new FileOutputStream(dst)) {
            byte[] buf = new byte[16384]; int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        }
    }

    private String iconDataUri(Drawable d) {
        try {
            Bitmap b = Bitmap.createBitmap(96, 96, Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(b);
            d.setBounds(0, 0, 96, 96); d.draw(c);
            ByteArrayOutputStream os = new ByteArrayOutputStream();
            b.compress(Bitmap.CompressFormat.PNG, 85, os);
            return "data:image/png;base64," + Base64.encodeToString(os.toByteArray(), Base64.NO_WRAP);
        } catch (Exception e) { return ""; }
    }

    private void seedSamples() {
        String[][] samples = {
                {"README-MetaForge.txt", "Meta-Forge local mod folder.\nDrop mod files here or use the app to download/import them."}
        };
        for (String[] s : samples) {
            File f = new File(modsDir, s[0]);
            if (f.exists()) continue;
            try (OutputStream os = new FileOutputStream(f)) { os.write(s[1].getBytes("UTF-8")); } catch (Exception ignored) {}
        }
    }

    private String readableSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format(Locale.US, "%.1f KB", bytes / 1024.0);
        return String.format(Locale.US, "%.1f MB", bytes / (1024.0 * 1024.0));
    }

    public class Bridge {
        @JavascriptInterface
        public String getDeviceInfo() {
            String ver = "1.0.0";
            try { ver = getPackageManager().getPackageInfo(getPackageName(), 0).versionName; } catch (Exception ignored) {}
            return "{\"model\":\"" + j(Build.MODEL) + "\",\"brand\":\"" + j(Build.BRAND) + "\",\"android\":\"" + j(Build.VERSION.RELEASE) + "\",\"sdk\":" + Build.VERSION.SDK_INT + ",\"appVersion\":\"" + j(ver) + "\",\"modsDir\":\"" + j(modsDir.getAbsolutePath()) + "\",\"downloadsDir\":\"" + j(downloadsDir.getAbsolutePath()) + "\"}";
        }

        @JavascriptInterface
        public String getInstalledApps() {
            StringBuilder out = new StringBuilder("[");
            boolean first = true;
            PackageManager pm = getPackageManager();
            List<PackageInfo> pkgs = pm.getInstalledPackages(0);
            for (PackageInfo p : pkgs) {
                ApplicationInfo app = p.applicationInfo;
                if (app == null) continue;
                boolean system = (app.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
                String label;
                try { label = app.loadLabel(pm).toString(); } catch (Exception e) { label = p.packageName; }
                if (!first) out.append(',');
                first = false;
                out.append("{\"name\":\"").append(j(label)).append("\",")
                        .append("\"package\":\"").append(j(p.packageName)).append("\",")
                        .append("\"version\":\"").append(j(p.versionName == null ? "" : p.versionName)).append("\",")
                        .append("\"system\":").append(system).append(",")
                        .append("\"icon\":\"").append(j(iconDataUri(app.loadIcon(pm)))).append("\"}");
            }
            out.append(']');
            return out.toString();
        }

        @JavascriptInterface
        public String listLocalMods() {
            StringBuilder out = new StringBuilder("[");
            File[] files = modsDir.listFiles();
            boolean first = true;
            if (files != null) {
                Arrays.sort(files, (a, b) -> Long.compare(b.lastModified(), a.lastModified()));
                for (File f : files) {
                    if (!f.isFile()) continue;
                    if (!first) out.append(',');
                    first = false;
                    out.append("{\"name\":\"").append(j(f.getName())).append("\",")
                            .append("\"path\":\"").append(j(f.getAbsolutePath())).append("\",")
                            .append("\"size\":\"").append(j(readableSize(f.length()))).append("\",")
                            .append("\"bytes\":").append(f.length()).append(",")
                            .append("\"modified\":").append(f.lastModified()).append("}");
                }
            }
            out.append(']');
            return out.toString();
        }

        @JavascriptInterface
        public void pickModFiles() {
            runOnUiThread(() -> {
                try {
                    Intent pick = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                    pick.addCategory(Intent.CATEGORY_OPENABLE);
                    pick.setType("*/*");
                    pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                    startActivityForResult(Intent.createChooser(pick, "Add mod files"), REQ_PICK_FILES);
                } catch (Exception e) { toast("Could not open file picker"); }
            });
        }

        @JavascriptInterface
        public String downloadMod(String modId, String url, String fileName) {
            try {
                if (url == null || (!url.startsWith("https://") && !url.startsWith("http://"))) {
                    return "{\"ok\":false,\"error\":\"Invalid URL\"}";
                }
                String safe = safeName(fileName == null || fileName.isEmpty() ? modId + ".bin" : fileName);
                DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url));
                req.setTitle("Meta-Forge: " + safe);
                req.setDescription("Downloading mod file");
                req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "MetaForge/" + safe);
                req.setAllowedOverMetered(true);
                req.setAllowedOverRoaming(true);
                long id = dm.enqueue(req);
                downloadMap.put(id, modId);
                emitDownload(modId, "started", 0, new File(downloadsDir, safe).getAbsolutePath(), "");
                return "{\"ok\":true,\"downloadId\":" + id + ",\"file\":\"" + j(safe) + "\"}";
            } catch (Exception e) {
                return "{\"ok\":false,\"error\":\"" + j(e.getMessage()) + "\"}";
            }
        }

        @JavascriptInterface
        public String importDownload(String fileName) {
            try {
                File src = new File(downloadsDir, safeName(fileName));
                if (!src.exists()) return "{\"ok\":false,\"error\":\"Downloaded file not found\"}";
                File dst = new File(modsDir, src.getName());
                copyFile(src, dst);
                return "{\"ok\":true,\"name\":\"" + j(dst.getName()) + "\",\"path\":\"" + j(dst.getAbsolutePath()) + "\"}";
            } catch (Exception e) {
                return "{\"ok\":false,\"error\":\"" + j(e.getMessage()) + "\"}";
            }
        }

        @JavascriptInterface
        public void openUrl(String url) {
            try {
                Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(i);
            } catch (Exception e) { toast("Could not open link"); }
        }

        @JavascriptInterface
        public void launchPackage(String pkg) {
            try {
                Intent i = getPackageManager().getLaunchIntentForPackage(pkg);
                if (i == null) { toast("App not installed"); return; }
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(i);
            } catch (Exception e) { toast("Could not launch app"); }
        }

        @JavascriptInterface
        public void shareText(String text) {
            try {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("text/plain");
                i.putExtra(Intent.EXTRA_TEXT, text);
                startActivity(Intent.createChooser(i, "Share"));
            } catch (Exception e) { toast("Could not share"); }
        }

        @JavascriptInterface
        public void toast(String msg) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show());
        }
    }
}



