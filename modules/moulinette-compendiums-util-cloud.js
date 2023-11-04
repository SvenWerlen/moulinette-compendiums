/**
 * Moulinette Compendium utils for Moulinette Cloud
 */
import { MoulinetteCompendiumsUtil } from "./moulinette-compendiums-util.js"

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
    const results = await client.post("/api/compendiums/search", { 
      query: searchTerms, 
      creatorId: selCreator, 
      packs: selPacks,
      meta: game.moulinette.compendiums.meta
    })
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
            fullImg : pack.hasAccess ? fullImage : thumb,
            filename: `${r.compendium}/`,
            type: r.type,
            pack: pack.idx,
            name: r.name,
            infos: MoulinetteCompendiumsUtil.getAdditionalInfoFromMeta(r)
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
   * Download dependencies
   */
  static async downloadDependencies(asset, pack) {
    // retrieve all the dependencies to be downloaded
    const assetAsString = JSON.stringify(asset)
    const deps = assetAsString.match(/"#DEP#[^"]+/g)
    // download all dependencies
    const toDownload = []
    if(deps) {
      for(const dep of deps) {
        toDownload.push(dep.substring(6))
      }
    }
    const sas = pack.sas ? `?${pack.sas}` : ""
    const destPath = game.moulinette.applications.MoulinetteFileUtil.getMoulinetteBasePath("compendiums", pack.publisher, pack.name)

    await game.moulinette.applications.MoulinetteFileUtil.downloadDependencies(toDownload, pack.path, sas, destPath)

    return JSON.parse(assetAsString.replaceAll("#DEP#", destPath))
  }

  /**
   * Check and handle drag & drop data (only if source == "mtte-compendiums")
   */
  static async handleDragAndDrop(data) {
    if("source" in data && data.source == "mtte-compendiums") {
      const cloudAsset = await MoulinetteCompendiumsCloudUtil.fetchAsset(data.assetId)
      if(cloudAsset) {
        const newData = await MoulinetteCompendiumsCloudUtil.downloadDependencies(cloudAsset, data.pack)
        data.data = newData  
      }
    }
  }

}