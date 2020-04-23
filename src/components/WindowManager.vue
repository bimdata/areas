<script>
import Window from "./Window.vue";
import WindowContainer from "./WindowContainer.vue";
export default {
  name: "WindowManager",
  components: {
    Window,
    WindowContainer
  },
  data() {
    return {
      layout: null
    };
  },
  props: {
    cfg: {
      type: Object,
      required: true
    }
  },
  render(h) {
    console.log("window manager render")
    return h("div", { class: "window-manager" }, [
      makeWindowContainer(h, this.layout.windows, this.layout.direction)
    ]);
  },
  created() {
    this.parseCfg(this.cfg);
    Object.getPrototypeOf(this.$root).$windowManager = {
      context: {
        get window() {
          console.log("try to get window")
        }
      }
    };
  },
  provide() {
    return {
      windowManager: this
    };
  },
  computed: {
    windows() {
      const getWindows = layer =>
        layer.windows.filter(win => win.type === "window");
      const getLayers = layer =>
        layer.windows.filter(win => win.type === "layer");

      const getNestedWindows = layer => [
        ...getWindows(layer),
        ...getLayers(layer)
          .map(getNestedWindows)
          .flat()
      ];

      return getNestedWindows(this.layout).sort(sortById);
    }
  },
  methods: {
    parseCfg(cfg) {
      const idGen = makeIdGenerator();
      this.layout = this.parseLayer(cfg, idGen);
    },
    parseLayer(layer, idGen) {
      return {
        type: "layer",
        direction: layer.direction,
        windows: layer.windows.map(win => {
          if (win.windows) {
            return this.parseLayer(win, idGen);
          } else {
            return {
              type: "window",
              id: idGen(),
              component: win,
              instance: null
            };
          }
        })
      };
    }
  }
};

function sortById(a, b) {
  return a.id > b.id ? 1 : a.id < b.id ? -1 : 0;
}

function makeWindowContainer(h, windows, direction = "row") {
  return h(
    WindowContainer,
    { props: { direction } },
    windows.map(win => {
      //TODO type check to be sure that this is a component or a window container config
      if (win.windows) {
        return makeWindowContainer(h, win.windows, win.direction);
      } else {
        return h(
          Window,
          {
            props: { id: win.id },
            on: { created: instance => (win.instance = instance) }
          },
          [h(win.component)]
        );
      }
    })
  );
}

function* idGenerator() {
  let i = 1;
  while (i < Number.MAX_SAFE_INTEGER) {
    yield i++;
  }
  throw "Cannot generate more ids";
}

function makeIdGenerator() {
  const gen = idGenerator();
  return () => gen.next().value;
}
</script>

<style scoped>
.window-manager {
  background-color: darkslategrey;
  height: 100%;
  width: 100%;
  display: flex;
}
</style>
