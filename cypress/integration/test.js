describe('Starting with simple area', () => {
  beforeEach(() => {
    cy.visit('test');
    const cfg = {
      components: [{ render(h) { return h("div", "Hey !") } }],
      layout: {
        componentIndex: 0
      }
    };
    cy.window().then(win => {
      win.areas = win.mountApp(cfg);
    });
  });

  it('Should render the simple area', () => {
    cy.get("#window-1").contains("Hey !");
    cy.window().then(win => {
      cy.get("#app").then(app => expect(win.areas.$el).to.equal(app))
    })
  });
});