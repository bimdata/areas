import { shallowMount } from '@vue/test-utils';
import WindowManager from "../src/WindowManager.vue";

const testComponent1 = {
  render(h) {
    return h("div", "test component 1");
  }
}

describe('WindowManager', () => {
  test("Should work with only one area", () => {
    const cfg = {
      components: [
        { props: { text: { type: String, default: "no text provided" } }, render(h) { return h("div", this.text) }, mounted() { this.$emit("mounted") } }
      ],
      layout: {
        componentIndex: 0
      }
    };
    shallowMount(WindowManager, { propsData: { cfg } });
  });

  // it('renders the correct markup', () => {
  //   expect(wrapper.html()).toContain('<div class="window-manager"></div>')
  // })

  // it's also easy to check for the existence of elements
  // it('has a button', () => {
  //   expect(wrapper.contains('button')).toBe(true)
  // })
})