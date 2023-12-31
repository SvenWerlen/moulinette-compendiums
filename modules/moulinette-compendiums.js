import { MoulinetteCompendiumsCloudUtil } from "./moulinette-compendiums-util-cloud.js"
import { MoulinetteCompendiumsUtil } from "./moulinette-compendiums-util.js"
import { MoulinetteCompendiumsPreview } from "./moulinette-compendiums-preview.js"

/**
 * Moulinette Module for compendiums
 */
export class MoulinetteCompendiums extends game.moulinette.applications.MoulinetteForgeModule {
  
  static INDEX_FOLDER = "moulinette"
  static INDEX_FILE = "index-compendiums.json"

  constructor() {
    super()
  }
  
  supportsWholeWordSearch() { return true }

  supportsPlayersMode() {
    return game.settings.get("moulinette-compendiums", "enable4players")
  }

  clearCache() {
    this.assets = null
    this.assetsPacks = null
    this.searchResults = null
  }
  
  /**
   * Returns the list of available packs
   */
  async getPackList() {
    
    if(this.assetsPacks) {
      return duplicate(this.assetsPacks.filter((p) => p.isLocal || p.hasAccess))
    }

    // fetch from index
    const data = await MoulinetteCompendiums.indexAllCompendiums()
    this.assetsPacks = data.packs
    this.assets = data.assets

    // fetch from Moulinette Cloud
    if(game.settings.get("moulinette-core", "enableMoulinetteCloud")) {
      const lastIdx = data.packs.length
      const user = await game.moulinette.applications.Moulinette.getUser() // don't remove! Otherwise won't retrieve user session
      const cloudPacks = await MoulinetteCompendiumsCloudUtil.getCloudPacks(lastIdx)
      this.assetsPacks = this.assetsPacks.concat(cloudPacks)
    }

    return duplicate(this.assetsPacks.filter((p) => p.isLocal || p.hasAccess))
  }
  
  
  /**
   * Implements getAssetList
   */
  async getAssetList(searchTerms, packs, publisher, moduleFilters) {
    let assets = []
    const packList = packs == "-1" ? null : ('' + packs).split(",").map(Number);

    // pack must be selected or terms provided
    if(!packList && (!publisher || publisher.length == 0) && (!searchTerms || searchTerms.length == 0)) {
      return []
    }
    
    const wholeWord = game.settings.get("moulinette", "wholeWordSearch")
    const searchTermsList = searchTerms.split(" ")
    
    // LOCAL SEARCH
    // filter list according to search terms and selected pack
    this.searchResults = this.assets.filter( t => {
      // pack doesn't match selection
      if( packList && !packList.includes(t.pack) ) return false
      // publisher doesn't match selection
      if( publisher && publisher != this.assetsPacks[t.pack].publisher ) return false
      // check if text match
      for( const f of searchTermsList ) {
        const textToSearch = game.moulinette.applications.Moulinette.cleanForSearch(t.name + " " + t.filename)
        const regex = wholeWord ? new RegExp("\\b"+ f.toLowerCase() +"\\b") : new RegExp(f.toLowerCase())
        if(!regex.test(textToSearch)) {
          return false;
        }
      }
      return true;
    })
    // CLOUD SEARCH
    if(game.settings.get("moulinette-core", "enableMoulinetteCloud")) {
      const packIds = packList ? packList.map(p => this.assetsPacks[p].packId) : null
      const cloudAssets = await MoulinetteCompendiumsCloudUtil.searchCloudAssets(searchTerms, publisher, packIds, this.assetsPacks)
      this.searchResults = this.searchResults.concat(cloudAssets)
    }

    // sort results by name
    this.searchResults.sort((a,b) => a.name.localeCompare(b.name))
    
    const viewMode = game.settings.get("moulinette", "displayMode")
    
    // view #1 (all mixed)
    if(viewMode == "tiles") {
      let idx = 0
      for(const r of this.searchResults) {
        idx++
        assets.push(await this.generateAsset(r, idx))
      }
    }
    // view #2 (by folder)
    else if(viewMode == "list" || viewMode == "browse") {
      const folders = game.moulinette.applications.MoulinetteFileUtil.foldersFromIndexImproved(this.searchResults, this.assetsPacks);
      const keys = Object.keys(folders).sort()
      let folderIdx = 0
      for(const k of keys) {
        folderIdx++;
        const breadcrumb = game.moulinette.applications.Moulinette.prettyBreadcrumb(k)
        if(viewMode == "browse") {
          assets.push(`<div class="folder" data-idx="${folderIdx}"><h2 class="expand">${breadcrumb} (${folders[k].length}) <i class="fas fa-angle-double-down"></i></h2></div>`)
        } else {
          assets.push(`<div class="folder" data-idx="${folderIdx}"><h2>${breadcrumb} (${folders[k].length})</div>`)
        }
        for(const a of folders[k]) {
          assets.push(await this.generateAsset(a, a.idx, folderIdx))
        }
      }
    }
    return assets
  }


  /**
   * Generate a new asset (HTML) for the given result and idx
   */
  async generateAsset(r, idx, folderIdx = null) {
    const pack = this.assetsPacks[r.pack]
    
    // ensure compendium is loaded before accessing it
    if(pack.isLocal && game.packs.get(r.filename)?.size === 0) {
       await game.packs.get(r.filename)?.getDocuments();
    }

    // add folder index if browsing by folder
    const folderHTML = folderIdx ? `data-folder="${folderIdx}"` : ""

    // thumbnail
    let thumbSrc = r.img ? r.img : "modules/moulinette-core/img/no-photo.webp"
    let typeIcon = "fa-solid fa-question"
    const type = r.type ? r.type : pack.type // type defined in asset (cloud) or on packs (local)
    if(type in MoulinetteCompendiumsUtil.ASSET_ICON) {
      typeIcon = MoulinetteCompendiumsUtil.ASSET_ICON[type]
    }
    if(type == "JournalEntry") {
      typeIcon = null
      thumbSrc = "modules/moulinette-compendiums/img/notebook.svg"
    }
    
    let html = `<div class="asset draggable" data-idx="${idx}" data-path="${r.filename}" ${folderHTML}>`
    // entry icon
    html += `<img width="75" height="75" src="${thumbSrc}"/>`
    // entry title
    const titleHover = r.name.length > 25 ? `title="${r.name}"` : "" // show title on mouse over (but only if length > 25)
    html += `<div class="details"><div class="title" ${titleHover}>${r.name}</div>`
    // entry additional informations
    if(r.infos.text1) {
      html += `<p>${r.infos.text1}</p>`
    }
    if(r.infos.text2) {
      html += `<p>${r.infos.text2}</p>`
    }
    // entry additional icons
    html += `<div class="icons">`
    r.infos.icons.forEach((icon) => {
      html += `<div class="info${icon.action ? " action " + icon.action : ""}"><i class="${icon.img}" title="${icon.label}"></i></div>`
    })
    html += "</div>"
    // entry type
    html += "</div>"
    if(typeIcon) {
      html += `<div class="type"><i class="${typeIcon}" title="${type}"></i></div>`
    }
    // entry system (if specific)
    if(r.infos.system) {
      html += `<div class="system">${r.infos.system}</div>`
    }

    return html + "</div>"
  }

  /**
   * Implements listeners
   */
  activateListeners(html) {
    // keep html for later usage
    this.html = html

    // fallback image
    this.html.find(".asset img").on('error', ev => {
      ev.preventDefault();
      $(ev.currentTarget).attr('src', "modules/moulinette-core/img/no-photo.webp")
    });

    // Click on asset => open asset sheet
    const parent = this
    this.html.find(".asset").click(async function(ev) {
      ev.preventDefault();
      const element = ev.currentTarget;
      const assetIdx = $(element).data("idx");
      if(!assetIdx || assetIdx <= 0 || assetIdx > parent.searchResults.length) {
        return console.error("Moulinette Compendiums | Invalid index for asset", assetIdx)
      }
      const searchResult = parent.searchResults[assetIdx-1]
      if(searchResult) {
        const pack = parent.assetsPacks[searchResult.pack]
        // search result is from local compendiums
        if(pack.isLocal) {
          fromUuid(searchResult.id).then((el) => el.sheet.render(true))
        } 
        // search result is from Moulinette Cloud
        else {
          const cloudAsset = await MoulinetteCompendiumsCloudUtil.fetchAsset(searchResult.id)
          new MoulinetteCompendiumsPreview(parent, searchResult, cloudAsset, pack).render(true)
        }
      }
    })

    // Click on icon action => execute
    this.html.find(".asset .icons .action").click(ev => {
      ev.preventDefault();
      ev.stopPropagation();
      const element = $(ev.currentTarget).parents('.asset').first();
      const assetIdx = element.data("idx");
      if(!assetIdx || assetIdx <= 0 || assetIdx > this.searchResults.length) {
        return console.error("Moulinette Compendiums | Invalid index for asset", assetIdx)
      }
      const searchResult = this.searchResults[assetIdx-1]
      const pack = this.assetsPacks[searchResult.pack]
      fromUuid(searchResult.id).then((entry) => {
        MoulinetteCompendiumsUtil.executeAction(entry, pack.type)
      })
    })
  }
  

  /**
   * Footer: Dropmode
   */
  async getFooter() {
    return ""
  }

  async onAction(classList) {
    // ACTION - INDEX
    if(classList.contains("index")) {
      await MoulinetteCompendiums.indexAllCompendiums(true)
      return true
    }
  }

  onDragStart(ev) {
    const element = ev.currentTarget;
    const assetIdx = $(element).data("idx");
    if(!assetIdx || assetIdx <= 0 || assetIdx > this.searchResults.length) {
      return
    }
    
    // action
    const asset = this.searchResults[assetIdx-1]
    const pack = this.assetsPacks[asset.pack]
    if(pack.isRemote) {
      ev.dataTransfer.setData("text/plain", JSON.stringify({
        source: "mtte-compendiums",
        type: asset.type,
        pack: pack,
        assetId: asset.id
      }));
    } else {
      ev.dataTransfer.setData("text/plain", JSON.stringify({
        type: pack.type,
        uuid: asset.id
      }));
    }
  }

  /**
   * Recursively build the folder path
   */
  static generateFoldersPath(folder) {
    if(!folder) return ""
    return MoulinetteCompendiums.generateFoldersPath(folder.folder) + folder.name + "/"
  }
  
  /**
   * This function browses all compendiums and index all the content
   * - Indices are kept in a file /moulinette/index-compendiums.json
   * - Automatically updates indices of existing compendiums for which the version doesn't match
   * - Index is shared among all worlds of the installation
   * Returns the index based on enabled compendiums
   */
  static async indexAllCompendiums(reindex = false) {

    console.groupCollapsed("Moulinette Compendiums | Indexing all active compendiums in world... (expand to see details)")

    // read existing index
    let indexData = {}
    const noCache = "?ms=" + new Date().getTime();
    const indexPath = `${MoulinetteCompendiums.INDEX_FOLDER}/${MoulinetteCompendiums.INDEX_FILE}`
    const response = await fetch(indexPath + noCache, {cache: "no-store"}).catch(function(e) {
      console.warn(`Moulinette Compendiums | Index couldn't be downloaded (${indexPath})`, e)
    });
    if(response && response.status == 200) {
      indexData = await response.json();
    }

    // read all compendiums 
    let updated = false
    const assetsPacks = []
    const assets = []
    let idx = 0
    let processed = 0
    
    const progressbar = (new game.moulinette.applications.MoulinetteProgress(game.i18n.format("mtte.indexCompendiums", { count: game.packs.size})))
    progressbar.render(true)

    for(const p of game.packs) {
      progressbar.setProgress(Math.round((idx / game.packs.size)*100), game.i18n.format("mtte.indexCompendiumsMessage", { count: processed++ }))
    
      // check permission (v11)
      if(game.version.startsWith("11.") && !p.testUserPermission(game.user, "OBSERVER")) {
        continue;
      }
      // check visibility (v10)
      if(game.version.startsWith("10.") && !game.user.isGM && p.private) {
        continue;
      }

      let packId = p.metadata.id
      if(packId.startsWith("world.moulinette")) {
        continue;
      }

      let version = null
      // retrieve creator/publisher
      let creatorName = "??"
      // compendium from system => creator = name of the system
      if(p.metadata.packageType == "system") {
        version = game.system.version
        creatorName = game.system.title
      }
      // compendium from module => creator = title of the module
      else if(p.metadata.packageType == "module") {
        const module = game.modules.get(p.metadata.packageName)
        creatorName = module.title
        version = module.version
      }
      // compendium from world => creator = title of the world
      else if(p.metadata.packageType == "world") {
        creatorName = game.world.title
        packId = game.world.id + "." + packId // distinguish two same packs in different worlds
      }

      // check if already in index data (world compendiums must always re-indexed because they have no version)
      if(!reindex && packId in indexData && version && indexData[packId].version == version) {
        console.log(`Moulinette Compendiums | Re-using existing index for ${packId} (v. ${version})... (remove index ${indexPath} to force re-indexing)`)
        // retrieve pack and assets
        const pack = duplicate(indexData[packId].pack)
        pack.idx = idx,
        assetsPacks.push(pack)
        const indexedAssets = duplicate(indexData[packId].assets)
        for(const a of indexedAssets) {
          a.pack = idx
          assets.push(a)
        }
        idx++
        continue
      }
      
      let elements
      try {
        elements = await p.getDocuments()
      } catch(Error) {
        console.warn(`Moulinette Compendiums | Unable to fetch documents from compendium ${p.metadata.label}. Skipping...`)
        continue
      }

      const packData = {
        packId: p.metadata.id,
        publisher: creatorName,
        name: p.metadata.label,
        type: p.metadata.type,
        path: "",
        count: elements.length,
        isLocal: true,
      }

      // store in index (if not local)
      if(p.metadata.packageType != "world") {
        indexData[packId] = {
          version: version,
          pack: duplicate(packData),
          assets: []
        }
        updated = true
      }
      packData.idx = idx
      assetsPacks.push(packData)

      // retrieve all folders to build path
      const folder = MoulinetteCompendiums.generateFoldersPath(p.folder)

      // read all assets
      for(const el of elements) {
        const entry = {
          type: packData.type,
          system: game.system.id,
          meta: MoulinetteCompendiumsUtil.generateMetaFromLocal(el, packData.type)
        }
        const asset = { 
          id: el.uuid,
          img : MoulinetteCompendiumsUtil.getThumbnail(el, packData.type),
          filename: folder, // use for folder path
          name: el.name,
          //infos: MoulinetteCompendiumsUtil.getAdditionalInfo(el, packData.type)
          infos: MoulinetteCompendiumsUtil.getAdditionalInfoFromMeta(entry)
        }
        // store in index (if not local)
        if(p.metadata.packageType != "world") {
          indexData[packId].assets.push(duplicate(asset))
        }
        asset.pack = idx
        assets.push(asset)
      }

      idx++;
    }

    progressbar.setProgress(100, game.i18n.format("mtte.indexCompendiumsMessage", { count: processed++ }))

    // store index if updated
    if(updated) {
      await game.moulinette.applications.MoulinetteFileUtil.uploadFile(
        new File([JSON.stringify(indexData)], MoulinetteCompendiums.INDEX_FILE, { type: "application/json", lastModified: new Date() }), 
        MoulinetteCompendiums.INDEX_FILE, MoulinetteCompendiums.INDEX_FOLDER, true)
    }

    console.groupEnd()

    // apply exclusions
    const curExclusions = game.settings.get("moulinette", "dataExclusions")
    const filteredPacks = assetsPacks.filter((p) => !(p.publisher in curExclusions && ('*' in curExclusions[p.publisher] || p.name in curExclusions[p.publisher])))
    return { packs: filteredPacks, assets: assets }
  }
}
