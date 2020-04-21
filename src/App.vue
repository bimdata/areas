<template>
  <div id="app">
    <WindowManager/>
  </div>
</template>

<script>
import WindowManager from './components/WindowManager.vue'

export default {
  name: 'App',
  components: {
    WindowManager
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
