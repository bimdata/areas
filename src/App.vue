<template>
  <div id="app">
    <WindowManager :cfg="testConfig" ref="wm" />
  </div>
</template>

<script>
import WindowManager from "./components/WindowManager.vue";
import Dum1 from "./components/dummyComponents/dum1.vue";
import Dum2 from "./components/dummyComponents/dum2.vue";
import Dum3 from "./components/dummyComponents/dum3.vue";
import Dum4 from "./components/dummyComponents/dum4.vue";

export default {
  name: "App",
  data() {
    return {
      testConfig: {
        components: [Dum1, Dum2, Dum3, Dum4],
        layout: {
          direction: "row",
          children: [
            {
              name: "comp1",
              componentIndex: 0,
              cfg: {
                props: {
                  text: "Jean jean"
                }
              }
            },
            {
              componentIndex: 1
            },
            {
              direction: "column",
              children: [
                {
                  componentIndex: 2
                },
                {
                  componentIndex: null // empty component
                },
                {
                  componentIndex: 3,
                  cfg: {
                    on: {
                      mounted() {
                        console.log("Can know if mounted here !");
                      }
                    }
                  }
                }
              ],
              ratios: [20, 50, 30]
            }
          ],
          ratios: [5, 35, 60]
        }
      }
    };
  },
  mounted() {
    window.wm = this.$refs.wm;
    setTimeout(() => {
      this.$refs.wm.getComponentByName("comp1").cfg.props.text = "=D";
    }, 3000);
  },
  components: {
    WindowManager
  }
};
</script>

<style>
html,
body {
  height: 100%;
  margin: 0;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  background-color: aliceblue;
  height: 600px;
  width: 80%;
  margin: 20px auto;
}
</style>
