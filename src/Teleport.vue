<template>
  <div class="teleport">
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    targetId: {
      type: Number,
      require: true
    }
  },
  inject: ["areas"],
  provide() {
    const self = this;
    return {
      $area: {
        get id() {
          return self.targetId;
        },
        get domElement() {
          return self.areas.getArea(self.targetId).$el;
        },
        get component() {
          return self.areas.getArea(self.targetId);
        },
        get contentComponent() {
          return self.getChildrenComponent();
        },
        get areas() {
          return self.areas;
        },
        get areaContent() {
          return this.areas.areasContent[self.targetId];
        },
        onChange(handler) {
          if (typeof handler !== "function") {
            throw `onAreaChange only accept function, get "${typeof handler}"`;
          }
          self.onAreaChangeHandlers.push(handler);
        },
        offChange(handler) {
          self.onAreaChangeHandlers = self.onAreaChangeHandlers.filter(
            h => h !== handler
          );
        }
      }
    };
  },
  data() {
    return {
      child: null,
      onAreaChangeHandlers: []
    };
  },
  mounted() {
    this.$emit("mounted", { childInstance: this.getChildrenComponent() });
    this.child = this.$el.firstChild;
    this.$watch(
      "targetId",
      (newTargetId, oldTargetId) => {
        if (oldTargetId != null) {
          this.onAreaChangeHandlers.forEach(handler =>
            handler(newTargetId, oldTargetId)
          );
        }
        if (this.$el.contains(this.child)) {
          this.$el.removeChild(this.child);
        }
        this.attach(true);
      },
      {
        immediate: true
      }
    );
  },
  methods: {
    attach() {
      const targetElement = document.getElementById(
        this.areas.getDOMAreaId(this.targetId)
      );
      if (!targetElement) {
        throw `Teleport fails, no DOM element with id : "${this.targetId}".`;
      }
      while (targetElement.hasChildNodes()) {
        targetElement.removeChild(targetElement.firstChild);
      }
      if (!targetElement.contains(this.child)) {
        targetElement.appendChild(this.child);
      }
    },
    getChildrenComponent() {
      return this.$children[0];
    }
  }
};
</script>
