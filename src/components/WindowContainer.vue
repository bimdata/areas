<script>
export default {
  name: "window-container",
  render(h) {
    const windows = this.windows;
    if (!windows || windows.length < 2) {
      throw "Window container can only work with at least 2 windows.";
    }

    return h(
      "div",
      { class: "window-container", style: { flexDirection: this.direction } },
      windows
        .map((win, i) => {
          win.data.style = this.windowsWidth[i]; // TODO seems to be a hack...
          return i !== windows.length - 1
            ? [
                Object.assign({}, win), // Need to recreate object to tell vue to rerender
                h("div", {
                  style: {
                    [this.direction === "row"
                      ? "width"
                      : "height"]: `${this.separatorThickness}px`,
                    cursor:
                      this.direction === "row" ? "col-resize" : "row-resize",
                    flexShrink: 0
                  },
                  on: { mousedown: e => this.onSeparatorMouseDown(i, e) }
                })
              ]
            : Object.assign({}, win); // Need to recreate object to tell vue to rerender
        })
        .flat()
    );
  },
  data() {
    return {
      activeSeparatorIndex: null
    };
  },
  inject: ["windowManager"],
  props: {
    // TODO id may be injected with factory instead of props...
    id: {
      type: Number,
      require: true
    },
    windowsRatio: {
      type: Array,
      required: true
    },
    direction: {
      type: String,
      default: "row",
      validator(direction) {
        if (!["row", "column"].includes(direction)) {
          console.error(
            `Window container direction property can only be "row" or "column", received : "${direction}"`
          );
          return false;
        } else {
          return true;
        }
      }
    },
    separatorThickness: {
      type: Number,
      default: 3 // TODO may half a pixel be a problem
    },
    minRatio: {
      type: Number,
      default: 0
    }
  },
  computed: {
    windowsWidth() {
      return this.windowsRatio.map(
        ratio =>
          `${
            this.direction === "row" ? "width" : "height"
          }: max(0px, calc(${ratio}% - ${((this.windows.length - 1) *
            this.separatorThickness) /
            this.windows.length}px))`
      );
    },
    windows() {
      return this.$slots.default;
    }
  },
  methods: {
    makeSeparator(h) {},
    onSeparatorMouseDown(separatorIndex, e) {
      this.activeSeparatorIndex = separatorIndex;
      e.preventDefault();
      e.stopPropagation();
      document.body.style.setProperty(
        "cursor",
        this.direction === "row" ? "col-resize" : "row-resize",
        "important"
      );

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

      const sumPreWindowsRatio =
        this.activeSeparatorIndex === 0
          ? 0
          : this.windowsRatio.slice(0, this.activeSeparatorIndex).reduce(sum);
      const sumPostWindowsRatio =
        this.activeSeparatorIndex === this.windows.length - 2
          ? 0
          : this.windowsRatio.slice(this.activeSeparatorIndex + 2).reduce(sum);

      const newRatios = Array.from(this.windowsRatio);
      // set the ratio of the window at the left of the separator
      newRatios[this.activeSeparatorIndex] = clamp(
        containerRatio - sumPreWindowsRatio,
        this.minRatio,
        100 - (sumPreWindowsRatio + sumPostWindowsRatio + this.minRatio)
      );
      // // set the ratio of the window at the right of the separator
      newRatios[this.activeSeparatorIndex + 1] =
        100 -
        newRatios[this.activeSeparatorIndex] -
        (sumPreWindowsRatio + sumPostWindowsRatio);

      this.windowManager.updateContainerRatio(this.id, newRatios);
    },
    stopDrag(e) {
      this.activeSeparatorIndex = null;
      document.body.style.removeProperty("cursor");
      document.removeEventListener("mousemove", this.drag);
    }
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
.window-container {
  display: flex;
  width: 100%;
  height: 100%;
}
</style>