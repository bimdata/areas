import { mount } from '@vue/test-utils';
import WindowManager from "../src/WindowManager.vue";

describe('WindowManager', () => {
  // Now mount the component and you have the wrapper
  test("test env", () => {
    console.log("Working test environment.")
  });
  // const wrapper = mount(WindowManager)

  // it('renders the correct markup', () => {
  //   expect(wrapper.html()).toContain('<div class="window-manager"></div>')
  // })

  // it's also easy to check for the existence of elements
  // it('has a button', () => {
  //   expect(wrapper.contains('button')).toBe(true)
  // })
})