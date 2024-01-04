import { MoulinetteCompendiumsCloudUtil } from "./moulinette-compendiums-util-cloud.js";

/*************************
 * Preview a compendium
 *************************/
export class MoulinetteCompendiumsPreview extends FormApplication {

  constructor(parent, searchResult, asset, pack) {
    super(null, { title: game.i18n.format("mtte.compendiumPreview", { type: searchResult.type}) })
    this.parent = parent
    this.searchResult = duplicate(searchResult)
    this.asset = duplicate(asset);
    this.pack = duplicate(pack);
    
    //console.log(this.searchResult)
    //console.log(this.asset)
    //console.log(this.pack)
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "moulinette-compendiumpreview",
      classes: ["mtte", "forge", "preview"],
      template: "modules/moulinette-compendiums/templates/preview.hbs",
      width: 800,
      height: 600,
      closeOnSubmit: false,
      submitOnClose: false,
      resizable: true
    });
  }

  async getData() {
    const client = new game.moulinette.applications.MoulinetteClient()
    const information = await client.get(`/api/marketplace/${this.pack.packId}`)
    this.information = information.status == 200 ? information.data : null

    return { 
      searchResult: this.searchResult,
      information: this.information,
      description: this.generateDescription(),
      asset: this.asset, 
      pack: this.pack,
      compatible: !this.searchResult.system || this.searchResult.system == game.system.id
    }
  }

  generateDescription() {
    if(this.searchResult.type == "Adventure") {
      return `<h2>${game.i18n.localize("ADVENTURE.ImportHeaderOverview")}</h2> ${this.asset.description}`
    }
    return ""
  }

  activateListeners(html) {
    super.activateListeners(html);
    this.bringToTop()
    this.html = html

    html.find(".actions button").click(this._onAction.bind(this))
  }

  async _onAction(event) {
    event.preventDefault();
    const source = event.currentTarget;
    if(source.classList.contains("browsePack")) {
      this.close()
      game.moulinette.applications.MoulinetteAPI.searchUI("compendiums", { creator: this.pack.publisher, pack: this.pack.name})
    }
    else if(source.classList.contains("subscribe")) {
      if(this.information) {
        window.open(`${this.information.publisherUrl}/membership`, '_blank');
      }
    }
    else if(source.classList.contains("download")) {
      if(this.searchResult.fullImg && this.searchResult.filename) {
        const toDownload = this.searchResult.fullImg
        const folder = game.moulinette.applications.MoulinetteFileUtil.getMoulinetteBasePath("compendiums", this.pack.publisher, this.pack.name)
        const uploadList = []
        if(await game.moulinette.applications.MoulinetteFileUtil.downloadFile(toDownload, folder, this.searchResult.filename, false, uploadList)) {
          const path = folder + (folder.endsWith("/") ? "" : "/") + this.searchResult.filename  
          navigator.clipboard.writeText(path).then(() => {
            ui.notifications.info(game.i18n.localize("mtte.copiedClipboardSuccess"))
          })
          .catch(() => {
            ui.notifications.warn(game.i18n.localize("mtte.copiedClipboardFail"))
            console.warn(`Moulinette Compendiums | Copy to clipboard failed. Path to asset = ${path}`)
          });
        }
      }      
    }
    else if(source.classList.contains("import")) {
      const data = await MoulinetteCompendiumsCloudUtil.downloadDependencies(this.asset, this.pack)
      // special case for adventures
      if(this.searchResult.type == "Adventure") {
        const importer = new AdventureImporter(new Adventure(data))
        return importer.render(true)
      }
      
      // create new asset
      const documentClass = getDocumentClass(this.searchResult.type)
      const doc = await documentClass.create(data)
      if(doc.createThumbnail) {
        let thumbData = await doc.createThumbnail()
        await doc.update({thumb: thumbData.thumb}); // force generating the thumbnail
      }
      // switch to matching tab
      const tab = Object.values(ui).find(t => t.entryType == this.searchResult.type)
      if(tab) {
        tab.activate()
      }
      // render sheet
      if(doc.sheet) {
        doc.sheet.render(true)
      }     
      this.close()
    }
  }

}
