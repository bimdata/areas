<template>
  <div class="window-manager">
    <VerticalSplitWindowContainer />
  </div>
</template>

<script>
import Window from "./Window.vue";
import VerticalSplitWindowContainer from "./VerticalSplitWindowContainer.vue";
export default {
  name: "WindowManager",
  components: {
    Window,
    VerticalSplitWindowContainer
  }
};
</script>

<style scoped>
.window-manager {
  background-color: blanchedalmond;
  height: 100%;
  width: 100%;
  display: flex;
}
</style>
