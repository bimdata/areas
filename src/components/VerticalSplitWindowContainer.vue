<template>
  <div class="vertical-split">
    <Window class="window" :style="windowsStyle[0]" />
    <div class="vertical-separator" :style="`width:${separatorWidth}px`" @mousedown="onMouseDown"></div>
    <Window class="window" :style="windowsStyle[1]" />
  </div>
</template>

<script>
import Window from "./Window.vue";

export default {
  data() {
    return {
      containerWidth: null,
      windowsRatio: [50, 50],
      separatorCount: 1
    };
  },
  props: {
    windows: {
      type: Array
    },
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
  mounted() {
    this.containerWidth = this.$el.getBoundingClientRect().width; // TODO handle resize with observer
  },
  computed: {
    windowsStyle() {
      return this.windowsRatio.map(
        ratio =>
          `width: calc(${ratio}% - ${(this.separatorCount *
            this.separatorWidth) /
            2}px)` // TODO replace /2 by window count
      );
    }
  },
  methods: {
    onMouseDown(e) {
      e.preventDefault();
      e.stopPropagation();

      document.addEventListener("mousemove", this.drag);
      document.addEventListener("mouseup", e => this.stopDrag(e));
    },
    drag(e) {
      // TODO we need to know which separator is dragged to affect the good window ratios
      const ex = e.clientX;
      const { x, width } = this.$el.getBoundingClientRect();
      const w1ratio = Math.min(Math.max(((ex - x) / width) * 100, 0), 100);

      console.log(w1ratio);

      this.windowsRatio[0] = w1ratio;
      this.windowsRatio[1] = 100 - w1ratio;
      this.windowsRatio = Array.from(this.windowsRatio);
    },
    stopDrag(e) {
      document.removeEventListener("mousemove", this.drag);
    }
  }
};
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