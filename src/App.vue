<template>
  <div id="app">
    <WindowManager :cfg="testConfig" />
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
        direction: "row",
        children: [
          Dum1,
          Dum2,
          {
            direction: "column",
            children: [Dum3, Dum4],
            ratios: [70, 30]
          }
        ],
        ratios: [5, 35, 60]
      }
    };
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
