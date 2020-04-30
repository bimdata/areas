<template>
  <div class="dum1">Coucou {{text}}</div>
</template>

<script>
import Log from "./log.js";
export default {
  name: "dum1",
  // inject: ["$context"],
  mixins: [Log],
  props: {
    text: {
      type: String,
      default: "Unknown"
    }
  }
};
</script>