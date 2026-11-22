/* Meta-Forge catalog. Real direct downloads are provided only where a legitimate public source exists.
   Other entries are catalog listings with external/source links. */
window.META_FORGE = {
  app: {
    name: 'Meta-Forge',
    releasedBy: 'LYRA corp',
    version: '1.0.0',
    platform: 'Meta',
    status: 'Verified',
    discord: 'https://discord.gg/ydSPJUVMb2',
    description: 'Meta-Forge is a VR mod hub by LYRA corp. It lets you browse mods by game, view what each mod does, install/import local mod files, and download real mod files from legitimate public sources when available.'
  },
  games: [
    {
      id: 'gorilla-tag',
      name: 'Gorilla Tag',
      package: 'com.AnotherAxiom.GorillaTag',
      color: '#A855F7',
      summary: 'Movement-based VR tag game with a large modding community.',
      status: 'Verified'
    },
    {
      id: 'orion-drift',
      name: 'Orion Drift',
      package: 'com.AnotherAxiom.GorillaTag2',
      color: '#7E22CE',
      summary: 'Social VR sports/movement game by Another Axiom.',
      status: 'Unidentified'
    },
    {
      id: 'big-ballers-vr',
      name: 'Big Ballers 26',
      package: 'com.BigBallersVR.BigBallersBasketball',
      color: '#A855F7',
      summary: 'VR basketball game. Mod support varies by platform/build.',
      status: 'Unidentified'
    },
    {
      id: 'gym-class',
      name: 'Gym Class',
      package: 'com.IRLTeam.GymClass',
      color: '#7E22CE',
      summary: 'VR basketball/sports simulation with community content.',
      status: 'Unidentified'
    }
  ],
  mods: [
    {
      id: 'bark',
      name: 'Bark',
      gameId: 'gorilla-tag',
      version: 'v1.5.1',
      author: 'KyleTheScientist',
      status: 'Verified',
      category: 'Utility / Movement',
      description: 'Bark is a Gorilla Tag mod that adds an in-game 3D interface for toggling movement and utility modules. It works through a mod loader (BepInEx/Monke mod setup) and provides features like movement tools and gameplay utilities in modded lobbies.',
      howItWorks: 'Install a compatible Gorilla Tag mod loader, place the Bark DLL into your BepInEx/plugins folder, then launch Gorilla Tag in a modded environment. Use Bark\'s in-game menu to toggle modules.',
      source: 'https://github.com/KyleTheScientist/Bark',
      downloadUrl: 'https://github.com/KyleTheScientist/Bark/releases/download/v1.5.1/Bark-1.5.1.dll',
      fileName: 'Bark-1.5.1.dll',
      size: '6.5 MB',
      tags: ['real-download', 'github', 'dll']
    },
    {
      id: 'bepinex-gt',
      name: 'BepInEx (Gorilla Tag Mod Loader)',
      gameId: 'gorilla-tag',
      version: 'Community build',
      author: 'BepInEx Team / Community',
      status: 'Verified',
      category: 'Mod Loader',
      description: 'BepInEx is a mod loader/framework used by many Unity games, including Gorilla Tag mod setups. It loads mod DLLs and provides the plugin/runtime environment mods need to run.',
      howItWorks: 'Install the correct BepInEx build for your Gorilla Tag version, launch the game once to generate folders, then place compatible mod DLLs into BepInEx/plugins.',
      source: 'https://github.com/BepInEx/BepInEx',
      downloadUrl: '',
      fileName: '',
      size: 'Varies',
      tags: ['source', 'loader']
    },
    {
      id: 'gt-map-loader',
      name: 'Custom Map Loader Concept',
      gameId: 'gorilla-tag',
      version: 'Catalog',
      author: 'Community',
      status: 'Unidentified',
      category: 'Maps',
      description: 'A catalog entry representing custom map/loading workflows for Gorilla Tag. Actual map mod availability depends on your game version and mod loader compatibility.',
      howItWorks: 'Typically requires a mod loader and a compatible map loader mod. After installation, map files are placed in the mod\'s maps folder and selected in-game.',
      source: 'https://github.com/topics/gorillatag-mods',
      downloadUrl: '',
      fileName: '',
      size: 'N/A',
      tags: ['catalog']
    },
    {
      id: 'orion-drift-cosmetic-tools',
      name: 'Orion Drift Modding Resources',
      gameId: 'orion-drift',
      version: 'Catalog',
      author: 'Community / Another Axiom resources',
      status: 'Unidentified',
      category: 'Resources',
      description: 'Community modding resources and asset references for Orion Drift. Public, safe, Quest-installable mod downloads are limited; use official/community resources carefully.',
      howItWorks: 'Review official asset kits and community resources before using any third-party mod. Only install files from sources you trust and that match your platform/build.',
      source: 'https://oriondriftvr.com/asset-kit',
      downloadUrl: '',
      fileName: '',
      size: 'N/A',
      tags: ['catalog', 'external']
    },
    {
      id: 'big-ballers-court-pack',
      name: 'Big Ballers 26 Court Pack',
      gameId: 'big-ballers-vr',
      version: 'Catalog',
      author: 'Meta-Forge Community',
      status: 'Unidentified',
      category: 'Cosmetic / Catalog',
      description: 'A catalog concept for custom court/cosmetic packs for Big Ballers 26. This entry tracks community mod interest and installation notes; no unverified direct download is bundled.',
      howItWorks: 'If a compatible mod package is available, import it into Meta-Forge Library and follow the game-specific install guide. Always verify file source and game version compatibility.',
      source: 'https://www.meta.com/experiences/',
      downloadUrl: '',
      fileName: '',
      size: 'N/A',
      tags: ['catalog']
    },
    {
      id: 'gym-class-training-pack',
      name: 'Gym Class Training Pack',
      gameId: 'gym-class',
      version: 'Catalog',
      author: 'Meta-Forge Community',
      status: 'Unidentified',
      category: 'Training / Catalog',
      description: 'A catalog concept for Gym Class training/custom content packs. Meta-Forge can organize and stage files you import, but only install trusted files compatible with your game build.',
      howItWorks: 'Download or obtain a trusted mod file, import it into Meta-Forge Library, and follow the included installation instructions for your specific Gym Class build/platform.',
      source: 'https://www.meta.com/experiences/',
      downloadUrl: '',
      fileName: '',
      size: 'N/A',
      tags: ['catalog']
    }
  ]
};


