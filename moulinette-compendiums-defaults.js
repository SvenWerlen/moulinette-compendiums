/**
 * Defaults views (can be overwriten or extended by modules/systems)
 */
export class MoulinetteCompendiumsDefaults {

  /**
   * Default fields to be extracted from "data"
   * Required for previews
   */
  static getDefaultMetaData() {
    return {
      dnd5e: {
        Item: {
          type: 'type',
          source: 'system.source',
          rarity: 'system.rarity',
          armorType: 'system.armor.type',
          weaponType: 'system.weaponType',
          toolType: 'system.toolType'
        },
        Actor: {
          type: 'type',
          race: 'system.details.race',
          cr: 'system.details.cr',
          hp: 'system.attributes.hp.value',
          ac: 'system.attributes.ac.base',
          walk: 'system.attributes.movement.walk',
          units: 'system.attributes.movement.units',
          background: 'items[type==background].name',
          class: 'items[type==class].name',
          classLvl: 'items[type==class].system.levels'
        }
      },
      '*': {
        Scene: {
          grid: 'grid',
          width: 'width',
          height: 'height',
          walls: '#walls',
          lights: '#lights',
          sounds: '#sounds',
          tokens: '#tokens',
          notes: '#notes',
          drawings: '#drawings',
        },
        JournalEntry: {
          pages: '#pages'
        },
        Macro: {
          type: 'type',
          scope: 'scope'
        },
        RollTable: {
          results: '#collections.results'
        }
      }
    }
  }

  /**
   * Default previews
   *  - text1 : first line of text
   *  - text2 : second line of text
   */
  static getDefaultPreviews() {
    return {
      // DnD5e 
      dnd5e: {
        // Items
        Item: function(meta) {
          const infos = { text1: null, text2: null, icons: [] }
          if(meta?.type) {
            infos.text1 = game.i18n.localize(`TYPES.Item.${meta.type}`)
            if(meta.rarity) {
              infos.text1 += ` (${game.i18n.localize(CONFIG.DND5E.itemRarity[meta.rarity])})`
            }
          }
          if(meta?.weaponType) {
            infos.text2 = game.i18n.localize(CONFIG.DND5E.weaponTypes[meta.weaponType])
          }
          else if(meta?.armorType) {
            infos.text2 = game.i18n.localize(CONFIG.DND5E.armorTypes[meta.armorType])
          }
          else if(meta?.toolType) {
            infos.text2 = game.i18n.localize(CONFIG.DND5E.toolTypes[meta.toolType])
          }
          return infos
        },
        // Actors
        Actor: function(meta) {
          const infos = { text1: null, text2: null, icons: [] }
          if(meta?.type == "character") {
            infos.text1 = meta.class ? `Level ${meta.classLvl} ${meta.class}` : "No class"
            infos.text2 = meta.race ? meta.race : "No race"
            infos.text2 += meta.background ? ` - ${meta.background}` : ""
          }
          else if(meta?.type == "npc") {
            let cr = meta.cr
            if(cr == 0.125) cr = "1/8"
            if(cr == 0.25) cr = "1/4"
            if(cr == 0.5) cr = "1/2"
            infos.text1 = `CR ${cr} &nbsp;<i class="fa-solid fa-heart"></i> ${meta.hp}`
            infos.text2 = `<i class="fa-solid fa-shield"></i> ${meta.ac ? meta.ac : "?"} &nbsp;<i class="fa-solid fa-shoe-prints"></i> ${meta.walk} ${meta.units}`
          }
          return infos
        }
      },
      // Non-specific types
      '*': {
        // Scenes
        Scene: function(meta) {
          const infos = { text1: null, text2: null, icons: [] }
          // size
          if(meta?.grid) {
            const gridSize = meta.grid.size
            const w = Math.round(meta.width/gridSize)
            const h = Math.round(meta.height/gridSize)
            const step = `${meta.grid.distance} ${meta.grid.units}`
            infos.text1 = `<i class="fas fa-ruler"></i> ${w}x${h} (${step})`
          }
          // components
          if(meta.walls > 0)    { infos.icons.push({ img: "fa-solid fa-block-brick", label: game.i18n.localize("mtte.filterHasWalls") }) }
          if(meta.lights > 0)   { infos.icons.push({ img: "fa-regular fa-lightbulb", label: game.i18n.localize("mtte.filterHasLights") }) }
          if(meta.sounds > 0)   { infos.icons.push({ img: "fa-solid fa-music", label: game.i18n.localize("mtte.filterHasSounds") }) }
          if(meta.tokens > 0)   { infos.icons.push({ img: "fas fa-user-alt", label: game.i18n.localize("mtte.filterHasTokens") }) }
          if(meta.notes > 0)    { infos.icons.push({ img: "fa-solid fa-bookmark", label: game.i18n.localize("mtte.filterHasNotes") }) }
          if(meta.drawings > 0) { infos.icons.push({ img: "fa-solid fa-pencil-alt", label: game.i18n.localize("mtte.filterHasDrawings") }) }
         return infos
        },
        // JournalEntries
        JournalEntry: function(meta) {
          const infos = { text1: null, text2: null, icons: [] }
          infos.text1 = `${meta.pages} ${game.i18n.localize(meta.pages > 1 ? "mtte.pages" : "mtte.page")}`
          return infos
        },
        // Macros
        Macro: function(meta) {
          const infos = { text1: null, text2: null, icons: [] }
          if(meta.type) {
            const typeCapitalized = meta.type.charAt(0).toUpperCase() + meta.type.slice(1);
            infos.text1 = `${typeCapitalized} (${meta.scope})`
          }
          return infos
        },
        // RolleTables
        RollTable: function(meta) {
          const infos = { text1: null, text2: null, icons: [] }
          infos.text1 = `${meta.results} ${game.i18n.localize(meta.results > 1 ? "mtte.results" : "mtte.result")}`
          infos.icons.push({ img: "fa-solid fa-dice-d20", label: game.i18n.localize("roll"), action: "roll"})
          return infos
        }
      }
    }
  }

}
