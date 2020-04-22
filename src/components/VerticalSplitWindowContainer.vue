<script>
import Window from "./Window.vue";

export default {
  render(h) {
    const windows = this.windows;
    if (!windows || windows.length < 2) {
      throw "Vertical Split can only work with at least 2 windows.";
    }
    windows.forEach(win => {
      if (!win.data.staticClass) {
        win.data.staticClass = "window";
      } else if (!win.data.staticClass.split(" ").includes("window")) {
        win.data.staticClass = `${win.data.staticClass} window`;
      }
    });

    return h(
      "div",
      { class: "vertical-split" },
      windows
        .map((win, i) => {
          win.data.style = this.windowsWidth[i]; // TODO seems to be a hack...
          return i !== windows.length - 1
            ? [
                Object.assign({}, win), // Need to recreate object to tell vue to rerender
                h("div", {
                  class: "vertical-separator",
                  style: `width:${this.separatorWidth}px`,
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
      windowsRatio: null,
      activeSeparatorIndex: null
    };
  },
  props: {
    separatorWidth: {
      type: Number,
      default: 3
    },
    minRatio: {
      type: Number,
      default: 10
    }
  },
  components: {
    Window
  },
  created() {
    this.windowsRatio = Array(this.windows.length);
    this.windowsRatio.fill(100 / this.windows.length);
    // Ensure that the sum of all element is 100
    const [, ...headElements] = Array.from(this.windowsRatio);
    const sumHeadElements = headElements.reduce(sum);
    this.windowsRatio[this.windowsRatio.length - 1] = 100 - sumHeadElements;
  },
  computed: {
    windowsWidth() {
      return this.windowsRatio.map(
        ratio =>
          `width: calc(${ratio}% - ${((this.windows.length - 1) *
            this.separatorWidth) /
            this.windows.length}px)`
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

      document.addEventListener("mousemove", this.drag);
      document.addEventListener("mouseup", e => this.stopDrag(e));
    },
    drag(e) {
      const ex = e.clientX;
      const { x, width } = this.$el.getBoundingClientRect();
      const containerRatio = clamp(((ex - x) / width) * 100, 0, 100);

      const sumPreWindowsRatio =
        this.activeSeparatorIndex === 0
          ? 0
          : this.windowsRatio.slice(0, this.activeSeparatorIndex).reduce(sum);
      const sumPostWindowsRatio =
        this.activeSeparatorIndex === this.windows.length - 2
          ? 0
          : this.windowsRatio.slice(this.activeSeparatorIndex + 2).reduce(sum);

      this.windowsRatio[this.activeSeparatorIndex] = clamp(
        containerRatio - sumPreWindowsRatio,
        this.minRatio,
        100 - (sumPreWindowsRatio + sumPostWindowsRatio + this.minRatio)
      );
      this.windowsRatio[this.activeSeparatorIndex + 1] =
        100 -
        this.windowsRatio[this.activeSeparatorIndex] -
        (sumPreWindowsRatio + sumPostWindowsRatio);
      console.log(this.windowsRatio.reduce(sum));
      this.windowsRatio = Array.from(this.windowsRatio);
    },
    stopDrag(e) {
      this.activeSeparatorIndex = null;
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
.vertical-split {
  display: flex;
  width: 100%;
  height: 100%;
}
.vertical-separator {
  background-color: darkslategrey;
  cursor: col-resize;
}
.window {
  height: 100%; /* TODO This may be changes by width in horizontal split */
}
</style>