/**
 * Moulinette Compendium utils for Moulinette Cloud
 */
export class MoulinetteCompendiumsCloudUtil {

  static ASSET_TYPES_SUPPORTED = ["Actor", "Item", "JournalEntry", "RollTable", "Scene", "Macro", "Adventure", "Card", "Playlist"]

  /**
   * Fetches the list of all creators and packs from Moulinette Cloud
   */
  static async getCloudPacks(idx) {
    const client = new game.moulinette.applications.MoulinetteClient()
    const guid = game.moulinette?.user.id
    const results = await client.get(guid ? `/api/compendiums/packs?guid=${guid}` : "/api/compendiums/packs")
    const creators = []
    if(results.status == 200) {
      for(const r of results.data) {
        const packData = {
          idx: idx++,
          packId: r.packId,
          publisher: r.creator,
          name: r.pack,
          path: r.path,
          sas: r.sas,
          deps: [],
          count: r.count,
          isLocal: false,
          isRemote: true,
          hasAccess: r.hasAccess
        }
        creators.push(packData)
      }
    }
    return creators
  }

  /**
   * Executes a search on Moulinette Cloud
   */
  static async searchCloudAssets(searchTerms, selCreator, selPacks, packs) {
    const client = new game.moulinette.applications.MoulinetteClient()
    const results = await client.post("/api/compendiums/search", { query: searchTerms, creatorId: selCreator, packs: selPacks })
    const assets = []
    if(results.status == 200) {
      for(const r of results.data) {
        const pack = packs.find(p => p.packId == r.pack)
        if(pack) {
          // prepare thumbnail
          // 1) remplace DEP with path from pack
          // 2) replace image file with thumbnail
          // 3) add SAS if image is protected
          const thumb = r.img ? r.img.replace("#DEP#", pack.path + "/").replace(/\.[^/.]+$/, "") + "_thumb.webp?" + (pack.sas ? pack.sas : "") : null
          const fullImage = r.img ? r.img.replace("#DEP#", pack.path + "/") + "?" + (pack.sas ? pack.sas : "") : null

          const asset = { 
            id: r.id,
            img : thumb,
            fullImg : fullImage,
            filename: `${r.compendium}/`,
            type: r.type,
            pack: pack.idx,
            name: r.name,
            infos: { text1: "", text2: "", icons: []}
          }
          assets.push(asset)
        }
      }
    }
    return assets
  }

  /**
   * Fetch asset from Moulinette Cloud
   */
  static async fetchAsset(assetId) {
    const client = new game.moulinette.applications.MoulinetteClient()
    const guid = game.moulinette?.user.id
    const results = await client.get(`/api/compendiums/asset/${assetId}?guid=${guid}`)
    if(results.status == 200) {
      return results.data
    } else {
      console.warn("Moulinette Compendiums | Error while fetching asset from Moulinette Cloud", results.data)
      return null
    }
  }


  /**
   * Get Moulinette Compendium
   */
  static async getMoulinetteCompendium(type) {
    if(!MoulinetteCompendiumsCloudUtil.ASSET_TYPES_SUPPORTED.includes(type)) {
      console.log(`Moulinette Compendiums | Non supported asset type ${type}`)
      return null
    }
    const packId = `world.moulinette-${type.toLowerCase()}`
    let pack = game.packs.get(packId)
    if(!pack){
      let folder = game.folders.find(f => f.type == "Compendium" && f.name == "Moulinette")
      if(!folder) {
        folder = await Folder.create({
          name: "Moulinette",
          type: "Compendium",
          parent: null,
          color: "#ff6400"
        });
      }
      pack = await CompendiumCollection.createCompendium({
          id: packId,
          label: `Moulinette (${type})`,
          type: type
      });
      pack.setFolder(folder.id)
    }
    return pack
  }

  /**
   * Import an asset into the compendium
   */
  static async importIntoMoulinetteCompendium(asset, pack, type) {
    if(!asset) return
    const compendium = await MoulinetteCompendiumsCloudUtil.getMoulinetteCompendium(type)
    if(compendium) {
      // prepare asset for download
      const downloadAsset = { data: { deps: [] }, sas: pack.sas ? pack.sas : "" }

      // retrieve all dependencies
      const dataAsString = JSON.stringify(asset)
      const regex = /#DEP#[^"]+/g;
      const matches = dataAsString.match(regex);
      for(const m of matches) {
        downloadAsset.data.deps.push(m.substring(5))
      }

      // download all dependencies
      const newPaths = await game.moulinette.applications.MoulinetteFileUtil.downloadAssetDependencies(downloadAsset, pack, "compendium")
      
      // replace all dependencies
      const cleanAsset = JSON.parse(dataAsString.replaceAll("#DEP#", newPaths[0]))

      // find folder structure within the compendium
      let folderCreator = compendium.folders.find((f) => !f.parent && f.name == pack.publisher)
      if(!folderCreator) {
        folderCreator = await Folder.create({name: pack.publisher, type: type}, {pack: compendium.metadata.id})
      }
      let folderPack = folderCreator.children.find((f) => f.folder?.name == pack.name)
      if(!folderPack) {
        folderPack = await Folder.create({name: pack.name, type: type, parent: folderCreator.id}, {pack: compendium.metadata.id})
        // FVTT Bug! ID of folder same as parent => force refresh
        folderPack = folderCreator.children.find((f) => f.folder?.name == pack.name)
      }

      // force import into that specific folder
      cleanAsset.folder = folderPack.folder.id

      // download all dependencies
      console.log(pack)
      //const assetDoc = compendium.createDocument(cleanAsset, {keepId: true})
      //const importedDoc = await compendium.importDocument(assetDoc, {keepId: true}) // keepId doesn't work
      //importedDoc.sheet.render(true)
    }
  }


}