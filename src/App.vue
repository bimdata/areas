<template>
  <div id="app">
    <WindowManager />
  </div>
</template>

<script>
import WindowManager from "./components/WindowManager.vue";

export default {
  name: "App",
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
