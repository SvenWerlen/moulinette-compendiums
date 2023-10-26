/*************************
 * Preview a compendium
 *************************/
export class MoulinetteCompendiumsPreview extends FormApplication {

  constructor(parent, searchResult, asset, pack) {
    super()
    this.parent = parent
    this.searchResult = duplicate(searchResult)
    this.asset = duplicate(asset);
    this.pack = duplicate(pack);
    
    console.log(this.searchResult)
    console.log(this.asset)
    console.log(this.pack)

  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "moulinette-compendiumpreview",
      classes: ["mtte", "forge", "preview"],
      title: game.i18n.localize("mtte.compendiumPreview"),
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
      asset: this.asset, 
      pack: this.pack 
    }
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
    else if(source.classList.contains("import")) {
      // retrieve all the dependencies to be downloaded
      const assetAsString = JSON.stringify(this.asset)
      const deps = assetAsString.match(/"#DEP#[^"]+/g)
      // download all dependencies
      const toDownload = []
      for(const dep of deps) {
        toDownload.push(dep.substring(6))
      }
      const sas = this.pack.sas ? `?${this.pack.sas}` : ""
      const destPath = game.moulinette.applications.MoulinetteFileUtil.getMoulinetteBasePath("compendiums", this.pack.publisher, this.pack.name)
      await game.moulinette.applications.MoulinetteFileUtil.downloadDependencies(toDownload, this.pack.path, sas, destPath)
      // replace DEP paths
      const data = JSON.parse(assetAsString.replace("#DEP#", destPath))
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
