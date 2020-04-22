<script>
import Dum1 from "./dummyComponents/dum1.vue";
import Dum2 from "./dummyComponents/dum2.vue";
import Dum3 from "./dummyComponents/dum3.vue";
import Dum4 from "./dummyComponents/dum4.vue";

const testConfig = {
  direction: "row",
  windows: [
    Dum1,
    Dum2,
    {
      direction: "column",
      windows: [Dum3, Dum4]
    }
  ]
};

import Window from "./Window.vue";
import WindowContainer from "./WindowContainer.vue";
export default {
  name: "WindowManager",
  render(h) {
    return h(
      "div",
      { class: "window-manager" },
      testConfig && testConfig.windows // TODO is type checking ok ?
        ? [makeWindowContainer(h, testConfig.windows, testConfig.direction)]
        : null
    );
  },
  components: {
    Window,
    WindowContainer,
    // dum components
    Dum1,
    Dum2,
    Dum3,
    Dum4
  }
};

function makeWindowContainer(h, windows, direction = "row") {
  return h(
    WindowContainer,
    { props: { direction } },
    windows.map(win => {
      //TODO type check to be sure that this is a component or a window container config
      if (win.windows) {
        return makeWindowContainer(h, win.windows, win.direction);
      } else {
        return h(Window, [h(win)]);
      }
    })
  );
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
