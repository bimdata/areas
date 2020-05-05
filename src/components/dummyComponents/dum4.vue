<template>
  <div class="dum4">
    <canvas id="canvas" width="400" height="300"></canvas>
  </div>
</template>

<script>
import Log from "./log.js";
export default {
  name: "dum4",
  mixins: [Log],
  mounted() {
    const ctx = document.getElementById("canvas").getContext("2d");
    ctx.beginPath();
    ctx.arc(75, 75, 50, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.stroke();
    this.$emit("mounted");
  }
};
</script>