<template>
  <div class="dum2">
    <input type="text" v-model="text" />
    <p>{{text}}</p>
  </div>
</template>

<script>
import Log from "./log.js";
export default {
  name: "dum2",
  mixins: [Log],
  inject: ["$context"],
  data() {
    return {
      text: ":) coucou "
    };
  },
  watch: {
    text() {
      console.log(this.text);
    }
  }
};
</script>