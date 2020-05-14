<script>
export default {
  name: "container",
  props: {
    id: {
      type: Number,
      require: true
    },
    areasRatio: {
      type: Array,
      required: true
    },
    direction: {
      type: String,
      default: "row",
      validator(direction) {
        if (!["row", "column"].includes(direction)) {
          console.error(
            `Container direction property can only be "row" or "column", received : "${direction}"`
          );
          return false;
        } else {
          return true;
        }
      }
    },
    separatorThickness: {
      type: Number,
      default: 2
    },
    separatorMargin: {
      // used to help user to catch separator
      type: Number,
      default: 10
    },
    minRatio: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      activeSeparatorIndex: null
    };
  },
  inject: { _areas: "areas" },
  computed: {
    areasWidth() {
      return this.areasRatio.map(
        ratio =>
          `${
            this.direction === "row" ? "width" : "height"
          }: max(0px, calc(${ratio}% - ${((this.areas.length - 1) *
            this.separatorThickness) /
            this.areas.length}px))`
      );
    },
    areas() {
      return this.$slots.default;
    }
  },
  methods: {
    onSeparatorMouseDown(separatorIndex, e) {
      this.activeSeparatorIndex = separatorIndex;
      e.preventDefault();
      e.stopPropagation();
      this._areas.cursor = `--areas-global-cursor: ${
        this.direction === "row"
          ? "var(--areas-vertical-resize-cursor, ew-resize)"
          : "var(--areas-horizontal-resize-cursor, ns-resize)"
      }`;

      document.addEventListener("mousemove", this.drag);
      document.addEventListener("mouseup", e => this.stopDrag(e));
    },
    drag(e) {
      const clientPosition = this.direction === "row" ? e.clientX : e.clientY;
      const { x, y, width, height } = this.$el.getBoundingClientRect();
      const containerPosition = this.direction === "row" ? x : y;
      const containerDimension = this.direction === "row" ? width : height;
      const containerRatio = clamp(
        ((clientPosition - containerPosition) / containerDimension) * 100,
        0,
        100
      );

      const sumPreAreasRatio =
        this.activeSeparatorIndex === 0
          ? 0
          : this.areasRatio.slice(0, this.activeSeparatorIndex).reduce(sum);
      const sumPostAreasRatio =
        this.activeSeparatorIndex === this.areas.length - 2
          ? 0
          : this.areasRatio.slice(this.activeSeparatorIndex + 2).reduce(sum);

      const newRatios = Array.from(this.areasRatio);
      // set the ratio of the area at the left of the separator
      newRatios[this.activeSeparatorIndex] = clamp(
        containerRatio - sumPreAreasRatio,
        this.minRatio,
        100 - (sumPreAreasRatio + sumPostAreasRatio + this.minRatio)
      );
      // // set the ratio of the area at the right of the separator
      newRatios[this.activeSeparatorIndex + 1] =
        100 -
        newRatios[this.activeSeparatorIndex] -
        (sumPreAreasRatio + sumPostAreasRatio);

      this._areas.updateContainerRatio(this.id, newRatios);
    },
    stopDrag(e) {
      this.activeSeparatorIndex = null;
      this._areas.cursor = null;
      document.removeEventListener("mousemove", this.drag);
    },
    renderSeparator(h, index) {
      return h(
        "div",
        {
          attrs: {
            "data-test": "separator"
          },
          class: "container-separator",
          style: {
            [this.direction === "row"
              ? "width"
              : "height"]: `${this.separatorThickness}px`,
            cursor:
              this.direction === "row"
                ? "var(--areas-vertical-resize-cursor, ew-resize)"
                : "var(--areas-horizontal-resize-cursor, ns-resize)",
            "pointer-events": this._areas.noMode ? "auto" : "none"
          },
          on: { mousedown: e => this.onSeparatorMouseDown(index, e) }
        },
        [
          h("div", {
            class: "container-separator-margin",
            style: {
              zIndex: this._areas.zIndexStart + 2,
              [this.direction === "row" ? "left" : "top"]: `${-this
                .separatorMargin}px`,
              width:
                this.direction === "row"
                  ? `${this.separatorMargin * 2}px`
                  : "100%",
              height:
                this.direction === "row"
                  ? "100%"
                  : `${this.separatorMargin * 2}px`
            }
          })
        ]
      );
    }
  },
  render(h) {
    const areas = this.areas;
    if (!areas || areas.length < 2) {
      throw "Container can only work with at least 2 areas.";
    }

    return h(
      "div",
      { class: "container", style: { flexDirection: this.direction } },
      areas
        .map((area, i) => {
          area.data.style = this.areasWidth[i];
          return i !== areas.length - 1
            ? [
                Object.assign({}, area), // Need to recreate object to tell vue to rerender
                this.renderSeparator(h, i)
              ]
            : Object.assign({}, area); // Need to recreate object to tell vue to rerender
        })
        .flat()
    );
  }
};

function clamp(value, min = -Infinity, max = Infinity) {
  return Math.min(Math.max(value, min), max);
}

function sum(a, b) {
  return a + b;
}
</script>

<style scoped>
.container {
  display: flex;
  width: 100%;
  height: 100%;
}
.container-separator {
  position: relative;
  flex-shrink: 0;
}
.container-separator-margin {
  position: absolute;
}
</style>
