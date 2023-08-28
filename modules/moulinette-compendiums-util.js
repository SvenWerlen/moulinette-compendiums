/**
 * Moulinette Compendium utils
 */
export class MoulinetteCompendiumsUtil {

  static ASSET_ICON = {
    Actor:        "fas fa-user",
    Item:         "fas fa-suitcase",
    JournalEntry: "fas fa-book-open",
    RollTable:    "fas fa-th-list",
    Scene:        "fas fa-map",
    Macro:        "fas fa-code",
    Adventure:    "fa-solid fa-treasure-chest",
    Card:         "fa-solid fa-cards",
    Playlist:     "fas fa-music",
  }

  static capitalizeFirstLetter(string) {
    if(!string) return ""
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  /**
   * Returns a thumbnail for this entry (from compendium)
   */
  static getThumbnail(entry, type) {
    if(type == "Scene") {
      return entry.thumb
    }
    return entry.img
  }

  /**
   * Returns some additional information
   */
  static getAdditionalInfo(entry, type) {
    const infos = { data: [], icons: [], system: "" }
    
    if(type == "Scene") {
      // size
      const gridSize = entry.grid.size
      const w = Math.round(entry.dimensions.sceneWidth/gridSize)
      const h = Math.round(entry.dimensions.sceneHeight/gridSize)
      const step = `${entry.grid.distance} ${entry.grid.units}`
      infos.data.push(`<i class="fas fa-ruler"></i> ${w}x${h} (${step})`)
      // components
      if(entry.walls && entry.walls.size > 0)       { infos.icons.push({ img: "fa-solid fa-block-brick", label: game.i18n.localize("mtte.filterHasWalls") }) }
      if(entry.lights && entry.lights.size > 0)     { infos.icons.push({ img: "fa-regular fa-lightbulb", label: game.i18n.localize("mtte.filterHasLights") }) }
      if(entry.sounds && entry.sounds.size > 0)     { infos.icons.push({ img: "fa-solid fa-music", label: game.i18n.localize("mtte.filterHasSounds") }) }
      if(entry.tokens && entry.tokens.size > 0)     { infos.icons.push({ img: "fas fa-user-alt", label: game.i18n.localize("mtte.filterHasTokens") }) }
      if(entry.notes && entry.notes.size > 0)       { infos.icons.push({ img: "fa-solid fa-bookmark", label: game.i18n.localize("mtte.filterHasNotes") }) }
      if(entry.drawings && entry.drawings.size > 0) { infos.icons.push({ img: "fa-solid fa-pencil-alt", label: game.i18n.localize("mtte.filterHasDrawings") }) }
    }

    else if(type == "Item") {
      infos.data.push(`${MoulinetteCompendiumsUtil.capitalizeFirstLetter(entry.type)}`)
    }

    else if(type == "JournalEntry") {
      infos.data.push(`${entry.pages.size} ${game.i18n.localize(entry.pages.size > 1 ? "mtte.pages" : "mtte.page")}`)
    }

    else if(type == "Macro") {
      const type = MoulinetteCompendiumsUtil.capitalizeFirstLetter(entry.type)
      infos.data.push(`${type} (${entry.scope})`)
    }

    else if(type == "RollTable") {
      if(entry.collections && entry.collections.results) {
        const resultsCount = entry.collections.results.size
        infos.data.push(`${resultsCount} ${game.i18n.localize(resultsCount > 1 ? "mtte.results" : "mtte.result")}`)
        infos.icons.push({ img: "fa-solid fa-dice-d20", label: game.i18n.localize("roll"), action: "roll"})
      }
    }

    if(entry.system && entry.system.modelProvider) {
      infos.system = entry.system.modelProvider.id
    }

    return infos
  }

  /**
   * Execute action on clicked entry
   */
  static executeAction(entry, type) {
    if(entry && type == "RollTable") {
      entry.draw();
    }
  }


}