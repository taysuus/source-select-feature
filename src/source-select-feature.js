import { LitElement, html, css } from "lit";

const atLeastHaVersion = (
  version,
  major,
  minor,
  patch
) => {
  const [haMajor, haMinor, haPatch] = version.split(".", 3);

  return (
    Number(haMajor) > major ||
    (Number(haMajor) === major &&
      (patch === undefined
        ? Number(haMinor) >= minor
        : Number(haMinor) > minor)) ||
    (patch !== undefined &&
      Number(haMajor) === major &&
      Number(haMinor) === minor &&
      Number(haPatch) >= patch)
  );
};

const supportsMediaPlayerSourceSelectCardFeature = (stateObj) => {
  const [domain] = stateObj.entity_id.split(".");
  return domain === "media_player";
};

class MediaPlayerSourceSelectFeature extends LitElement {
  static get properties() {
    return {
      hass: undefined,
      config: undefined,
      stateObj: undefined,
    };
  }

  static getStubConfig() {
    return {
      type: "custom:media-player-source-select-feature",
      label: "Select",
    };
  }

  setConfig(config) {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    this.config = config;
  }

  render() {
    if (
      !this.config ||
      !this.hass ||
      !this.stateObj ||
      !supportsMediaPlayerSourceSelectCardFeature(this.stateObj)
    ) {
      return null;
    }

    const sources = this.stateObj.attributes.source_list || [];
    const current = this.stateObj.attributes.source;

    if (atLeastHaVersion(this.hass.connection.haVersion, 2026, 3)) {
      return html`
        <ha-control-select-menu
          show-arrow
          hide-label
          .hass=${this.hass}
          .value=${current ?? ""}
          .options=${sources.map((src) => ({
            value: src,
            label: src,
          }))}
          @wa-select=${this._selectChanged}
        ></ha-control-select-menu>
      `;
    }

    return html`
      <ha-control-select-menu
        @selected=${this._handleChange}
        .label="Source"
        .value=${current ?? ""}
        .showArrow=${true}
      >
        ${sources.map(
          (src) => html`<ha-list-item .value=${src}>${src}</ha-list-item>`
        )}
      </ha-control-select-menu>
    `;
  }

  async _handleChange(ev) {
    let newSource;
    if (atLeastHaVersion(this.hass.connection.haVersion, 2026, 3)) {
      newSource = ev.detail.item.value;
    } else {
      newSource = ev.target.value;
    }
    if (!newSource) return;

    await this.hass.callService("media_player", "select_source", {
      entity_id: this.stateObj.entity_id,
      source: newSource,
    });
  }

  static get styles() {
    return css`
      ha-control-select-menu {
        --control-select-menu-border-radius: var(--feature-border-radius, 12px);
        --control-select-menu-height: var(--feature-height, 42px);
        width: 100%;
        margin-bottom: 7px;
      }
    `;
  }
}

customElements.define(
  "media-player-source-select-feature",
  MediaPlayerSourceSelectFeature
);

window.customCardFeatures = window.customCardFeatures || [];
window.customCardFeatures.push({
  type: "media-player-source-select-feature",
  name: "Source Select",
  supported: supportsMediaPlayerSourceSelectCardFeature,
});
