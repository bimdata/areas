const MAIN_CLASS = ".window-manager";
const ID_PREFIX = "window-";
const WIDTH = 800;
const HEIGHT = 600;
const AREA_MAIN_CLASS = ".window";
// TODO MARGIN_OF_ERROR may be reduced after taking into accound separator thickness
const MARGIN_OF_ERROR = 3; // Because ratio are percentage computed to px... not perfect

// TODO fix the way elements are getted... especially separators. Cypress API can be use probably better.
// TODO fix naming : app instead of areas as alias after mounting the app
// TODO somae feature like swap may also be tested with mouse event instead of direct API (with drag and drop mode set for example)

describe('Simple area', () => {
  beforeEach(() => {
    cy.visit('test');
    const cfg = {
      components: [{ render(h) { return h("div", "Hey !") } }],
      layout: {
        componentIndex: 0
      }
    };
    cy.window().then(win => win.mountApp({ cfg, width: WIDTH, height: HEIGHT })).as("areas");
    cy.get(MAIN_CLASS).as("root");
  });

  it('Should render the simple area within all available space', () => {
    cy.get("@root").contains("Hey !");
    cy.get("@root").find(`#${ID_PREFIX}1`).should(el => {
      expect(el).to.have.length(1);
      expect(el[0].clientWidth).to.equal(WIDTH);
      expect(el[0].clientHeight).to.equal(HEIGHT);
    })
  });

  it('Should throw an error if trying to delete the root window', () => {
    cy.get("@areas").then(areas => {
      cy.spy(areas.$refs.areas, "deleteWindow");
      try {
        areas.$refs.areas.deleteWindow(1);
      } catch {
      } finally {
        expect(areas.$refs.areas.deleteWindow).to.have.throw();
      }
    });
  })
});

describe('Dual vertical areas', () => {
  beforeEach(() => {
    cy.visit('test');
    const cfg = {
      components: [
        { render(h) { return h("div", "Hey !") } },
        { render(h) { return h("div", "Ouille !") } }
      ],
      layout: {
        ratios: [30, 70],
        children: [
          {
            componentIndex: 0
          },
          {
            componentIndex: 1
          }
        ]
      }
    };
    cy.window().then(win => win.mountApp({ cfg, width: WIDTH, height: HEIGHT })).as("areas");
    cy.get(MAIN_CLASS).as("root");
  });

  it('Should render the two areas with the correct width and height', () => {
    cy.get("@root").contains("Hey !");
    cy.get("@root").contains("Ouille !");

    cy.get("@root").get(".window-container").children().get(AREA_MAIN_CLASS).should(els => {
      expect(els).to.have.length(2);
      const [area1, area2] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);

      // TODO this should take into accout separator width !
      const area1TheoreticalWidth = WIDTH * 30 / 100;
      const area2TheoreticalWidth = WIDTH * 70 / 100;
      expect(area1.clientWidth).to.be.within(
        area1TheoreticalWidth - MARGIN_OF_ERROR,
        area1TheoreticalWidth + MARGIN_OF_ERROR
      );
      expect(area2.clientWidth).to.be.within(
        area2TheoreticalWidth - MARGIN_OF_ERROR,
        area2TheoreticalWidth + MARGIN_OF_ERROR
      );
    });
  });

  it('Should update areas width when dragging the separator horizontally', () => {
    cy.get("@root").get(".window-container").children().not(AREA_MAIN_CLASS)
      .first().trigger('mousedown', "center").trigger("mousemove", { clientX: WIDTH / 10 });

    cy.get("@root").get(".window-container").children().get(AREA_MAIN_CLASS).should(els => {
      expect(els).to.have.length(2);
      const [area1, area2] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);

      // TODO this should take into accout separator width !
      const area1TheoreticalWidth = WIDTH * 10 / 100;
      const area2TheoreticalWidth = WIDTH * 90 / 100;
      expect(area1.clientWidth).to.be.within(
        area1TheoreticalWidth - MARGIN_OF_ERROR,
        area1TheoreticalWidth + MARGIN_OF_ERROR
      );
      expect(area2.clientWidth).to.be.within(
        area2TheoreticalWidth - MARGIN_OF_ERROR,
        area2TheoreticalWidth + MARGIN_OF_ERROR
      );
    });
  });

});

describe('Dual horizontal areas', () => {
  beforeEach(() => {
    cy.visit('test');
    const cfg = {
      components: [
        { render(h) { return h("div", "Hey !") } },
        { render(h) { return h("div", "Ouille !") } }
      ],
      layout: {
        ratios: [16, 84],
        direction: "column",
        children: [
          {
            componentIndex: 0
          },
          {
            componentIndex: 1
          }
        ]
      }
    };
    cy.window().then(win => win.mountApp({ cfg, width: WIDTH, height: HEIGHT })).as("areas");
    cy.get(MAIN_CLASS).as("root");
  });

  it('Should render the two areas with the correct width and height', () => {
    cy.get("@root").contains("Hey !");
    cy.get("@root").contains("Ouille !");

    cy.get("@root").get(".window-container").children().get(AREA_MAIN_CLASS).should(els => {
      expect(els).to.have.length(2);
      const [area1, area2] = els;

      expect(area1.clientWidth).to.equal(WIDTH);
      expect(area2.clientWidth).to.equal(WIDTH);

      // TODO this should take into accout separator width !
      const area1TheoreticalHeight = HEIGHT * 16 / 100;
      const area2TheoreticalHeight = HEIGHT * 84 / 100;
      expect(area1.clientHeight).to.be.within(
        area1TheoreticalHeight - MARGIN_OF_ERROR,
        area1TheoreticalHeight + MARGIN_OF_ERROR
      );
      expect(area2.clientHeight).to.be.within(
        area2TheoreticalHeight - MARGIN_OF_ERROR,
        area2TheoreticalHeight + MARGIN_OF_ERROR
      );
    });
  });

  it('Should update areas height when dragging the separator vertically', () => {
    cy.get("@root").get(".window-container").children().not(AREA_MAIN_CLASS)
      .first().trigger('mousedown', "center").trigger("mousemove", { clientY: HEIGHT / 2 }).trigger('mouseup');

    cy.get("@root").get(".window-container").children().get(AREA_MAIN_CLASS).should(els => {
      expect(els).to.have.length(2);
      const [area1, area2] = els;

      expect(area1.clientWidth).to.equal(WIDTH);
      expect(area2.clientWidth).to.equal(WIDTH);

      // TODO this should take into accout separator width !
      const area1TheoreticalHeight = HEIGHT * 50 / 100;
      const area2TheoreticalHeight = HEIGHT * 50 / 100;
      expect(area1.clientHeight).to.be.within(
        area1TheoreticalHeight - MARGIN_OF_ERROR,
        area1TheoreticalHeight + MARGIN_OF_ERROR
      );
      expect(area2.clientHeight).to.be.within(
        area2TheoreticalHeight - MARGIN_OF_ERROR,
        area2TheoreticalHeight + MARGIN_OF_ERROR
      );
    });
  });

});

describe('Three areas in the same direction (vertical)', () => {
  beforeEach(() => {
    cy.visit('test');
    const cfg = {
      components: [
        { render(h) { return h("div", "Hey !") } },
        { render(h) { return h("div", "Ouille !") } },
        { render(h) { return h("div", "Ola !") } }
      ],
      layout: {
        ratios: [30, 30, 40],
        direction: "row",
        children: [
          {
            componentIndex: 0
          },
          {
            componentIndex: 1
          },
          {
            componentIndex: 2
          }
        ]
      }
    };
    cy.window().then(win => win.mountApp({ cfg, width: WIDTH, height: HEIGHT })).as("areas");
    cy.get(MAIN_CLASS).as("root");
  });

  it('Should render the three areas with the correct width and height', () => {
    cy.get("@root").contains("Hey !");
    cy.get("@root").contains("Ouille !");
    cy.get("@root").contains("Ola !");

    cy.get("@root").get(".window-container").children().get(AREA_MAIN_CLASS).should(els => {
      expect(els).to.have.length(3);
      const [area1, area2, area3] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);
      expect(area3.clientHeight).to.equal(HEIGHT);

      // TODO this should take into accout separator width !
      const area1TheoreticalWidth = WIDTH * 30 / 100;
      const area2TheoreticalWidth = WIDTH * 30 / 100;
      const area3TheoreticalWidth = WIDTH * 40 / 100;
      expect(area1.clientWidth).to.be.within(
        area1TheoreticalWidth - MARGIN_OF_ERROR,
        area1TheoreticalWidth + MARGIN_OF_ERROR
      );
      expect(area2.clientWidth).to.be.within(
        area2TheoreticalWidth - MARGIN_OF_ERROR,
        area2TheoreticalWidth + MARGIN_OF_ERROR
      );
      expect(area3.clientWidth).to.be.within(
        area3TheoreticalWidth - MARGIN_OF_ERROR,
        area3TheoreticalWidth + MARGIN_OF_ERROR
      );
    });
  });

  it('Should only update ratios of related areas when moving a separator', () => {
    cy.get("@root").get(".window-container").children().not(AREA_MAIN_CLASS)
      .first().trigger('mousedown', "center").trigger("mousemove", { clientX: WIDTH / 2 }).trigger('mouseup');

    cy.get("@root").get(".window-container").children().get(AREA_MAIN_CLASS).should(els => {
      expect(els).to.have.length(3);
      const [area1, area2, area3] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);
      expect(area3.clientHeight).to.equal(HEIGHT);

      // TODO this should take into accout separator width !
      const area1TheoreticalWidth = WIDTH * 50 / 100;
      const area2TheoreticalWidth = WIDTH * 10 / 100;
      const area3TheoreticalWidth = WIDTH * 40 / 100;
      expect(area1.clientWidth).to.be.within(
        area1TheoreticalWidth - MARGIN_OF_ERROR,
        area1TheoreticalWidth + MARGIN_OF_ERROR
      );
      expect(area2.clientWidth).to.be.within(
        area2TheoreticalWidth - MARGIN_OF_ERROR,
        area2TheoreticalWidth + MARGIN_OF_ERROR
      );
      expect(area3.clientWidth).to.be.within(
        area3TheoreticalWidth - MARGIN_OF_ERROR,
        area3TheoreticalWidth + MARGIN_OF_ERROR
      );
    });
  });

  it('Should not move separator away from another separator', () => {
    cy.get("@root").get(".window-container").children().not(AREA_MAIN_CLASS)
      .first().trigger('mousedown', "center").trigger("mousemove", { clientX: WIDTH }).trigger('mouseup');

    cy.get("@root").get(".window-container").children().get(AREA_MAIN_CLASS).should(els => {
      expect(els).to.have.length(3);
      const [area1, area2, area3] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);
      expect(area3.clientHeight).to.equal(HEIGHT);

      // TODO this should take into accout separator width !
      const area1TheoreticalWidth = WIDTH * 60 / 100;
      const area2TheoreticalWidth = 0;
      const area3TheoreticalWidth = WIDTH * 40 / 100;
      expect(area1.clientWidth).to.be.within(
        area1TheoreticalWidth - MARGIN_OF_ERROR,
        area1TheoreticalWidth + MARGIN_OF_ERROR
      );
      expect(area2.clientWidth).to.be.within(
        area2TheoreticalWidth - MARGIN_OF_ERROR,
        area2TheoreticalWidth + MARGIN_OF_ERROR
      );
      expect(area3.clientWidth).to.be.within(
        area3TheoreticalWidth - MARGIN_OF_ERROR,
        area3TheoreticalWidth + MARGIN_OF_ERROR
      );
    });
  });

  it("Should fill the space and display the correct areas when deleting area", () => {

    cy.get("@root").contains("Hey !");
    cy.get("@root").contains("Ouille !");
    cy.get("@root").contains("Ola !");

    cy.get("@areas").then(areas => areas.$refs.areas.deleteWindow(2));

    cy.get("@root").contains("Hey !");
    cy.get("@root").contains("Ola !");

    cy.get("@root").get(".window-container").children().get(AREA_MAIN_CLASS).should(els => {
      expect(els).to.have.length(2);
      const [area1, area2] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);

      const area1TheoreticalWidth = WIDTH * 60 / 100;
      const area2TheoreticalWidth = WIDTH * 40 / 100;
      expect(area1.clientWidth).to.be.within(
        area1TheoreticalWidth - MARGIN_OF_ERROR,
        area1TheoreticalWidth + MARGIN_OF_ERROR
      );
      expect(area2.clientWidth).to.be.within(
        area2TheoreticalWidth - MARGIN_OF_ERROR,
        area2TheoreticalWidth + MARGIN_OF_ERROR
      );
    });

    cy.get("@areas").then(areas => areas.$refs.areas.deleteWindow(1));
    cy.get("@root").contains("Ola !");

    cy.get("@root").get(AREA_MAIN_CLASS).should(els => {
      expect(els).to.have.length(1);
      const [area2] = els;

      expect(area2.clientHeight).to.equal(HEIGHT);
      expect(area2.clientWidth).to.equal(WIDTH);
    });

  })
});

describe('Three areas in a custom layout (a big left, two at the right, little at the top, big at the bottom)', () => {
  beforeEach(() => {
    cy.visit('test');
    const cfg = {
      components: [
        { render(h) { return h("div", "Hey !") } },
        { render(h) { return h("div", "Ouille !") } },
        { render(h) { return h("div", "Ola !") } }
      ],
      layout: {
        ratios: [20, 80],
        direction: "row",
        children: [
          {
            componentIndex: 1
          },
          {
            ratios: [15, 85],
            direction: "column",
            children: [
              {
                componentIndex: 2
              },
              {
                componentIndex: 0
              },
            ]
          }
        ]
      }
    };
    cy.window().then(win => win.mountApp({ cfg, width: WIDTH, height: HEIGHT })).as("areas");
    cy.get(MAIN_CLASS).as("root");
  });

  it('Should render the three areas with the correct width and height', () => {
    cy.get("@root").contains("Hey !");
    cy.get("@root").contains("Ouille !");
    cy.get("@root").contains("Ola !");

    cy.get("@root").get(".window-container").children().get(AREA_MAIN_CLASS).should(els => {
      expect(els).to.have.length(3);
      const [area1, area2, area3] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      const area2TheoreticalHeight = HEIGHT * 15 / 100;
      const area3TheoreticalHeight = HEIGHT * 85 / 100;
      expect(area2.clientHeight).to.be.within(
        area2TheoreticalHeight - MARGIN_OF_ERROR,
        area2TheoreticalHeight + MARGIN_OF_ERROR
      );
      expect(area3.clientHeight).to.be.within(
        area3TheoreticalHeight - MARGIN_OF_ERROR,
        area3TheoreticalHeight + MARGIN_OF_ERROR
      );

      const area1TheoreticalWidth = WIDTH * 20 / 100;
      const area2TheoreticalWidth = WIDTH * 80 / 100;
      const area3TheoreticalWidth = WIDTH * 80 / 100;
      expect(area1.clientWidth).to.be.within(
        area1TheoreticalWidth - MARGIN_OF_ERROR,
        area1TheoreticalWidth + MARGIN_OF_ERROR
      );
      expect(area2.clientWidth).to.be.within(
        area2TheoreticalWidth - MARGIN_OF_ERROR,
        area2TheoreticalWidth + MARGIN_OF_ERROR
      );
      expect(area3.clientWidth).to.be.within(
        area3TheoreticalWidth - MARGIN_OF_ERROR,
        area3TheoreticalWidth + MARGIN_OF_ERROR
      );
    });
  });

  it('Should only update ratios of related areas when moving a separator', () => {
    cy.get("@root").get(".window-container").children().not(AREA_MAIN_CLASS)
      .first().trigger('mousedown', "center").trigger("mousemove", { clientX: WIDTH / 2 }).trigger('mouseup');

    cy.get("@root").get(".window-container").children().get(AREA_MAIN_CLASS).should(els => {
      expect(els).to.have.length(3);
      const [area1, area2, area3] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      const area2TheoreticalHeight = HEIGHT * 15 / 100;
      const area3TheoreticalHeight = HEIGHT * 85 / 100;
      expect(area2.clientHeight).to.be.within(
        area2TheoreticalHeight - MARGIN_OF_ERROR,
        area2TheoreticalHeight + MARGIN_OF_ERROR
      );
      expect(area3.clientHeight).to.be.within(
        area3TheoreticalHeight - MARGIN_OF_ERROR,
        area3TheoreticalHeight + MARGIN_OF_ERROR
      );

      const area1TheoreticalWidth = WIDTH * 50 / 100;
      const area2TheoreticalWidth = WIDTH * 50 / 100;
      const area3TheoreticalWidth = WIDTH * 50 / 100;
      expect(area1.clientWidth).to.be.within(
        area1TheoreticalWidth - MARGIN_OF_ERROR,
        area1TheoreticalWidth + MARGIN_OF_ERROR
      );
      expect(area2.clientWidth).to.be.within(
        area2TheoreticalWidth - MARGIN_OF_ERROR,
        area2TheoreticalWidth + MARGIN_OF_ERROR
      );
      expect(area3.clientWidth).to.be.within(
        area3TheoreticalWidth - MARGIN_OF_ERROR,
        area3TheoreticalWidth + MARGIN_OF_ERROR
      );
    });

    cy.get("@root").get(".window-container").children().get(".window-container").children().not(AREA_MAIN_CLASS)
      .last().trigger('mousedown', "center").trigger("mousemove", { clientY: HEIGHT * 0.78 });

    cy.get("@root").get(".window-container").children().get(AREA_MAIN_CLASS).should(els => {
      expect(els).to.have.length(3);
      const [area1, area2, area3] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      const area2TheoreticalHeight = HEIGHT * 78 / 100;
      const area3TheoreticalHeight = HEIGHT * 22 / 100;
      expect(area2.clientHeight).to.be.within(
        area2TheoreticalHeight - MARGIN_OF_ERROR,
        area2TheoreticalHeight + MARGIN_OF_ERROR
      );
      expect(area3.clientHeight).to.be.within(
        area3TheoreticalHeight - MARGIN_OF_ERROR,
        area3TheoreticalHeight + MARGIN_OF_ERROR
      );

      const area1TheoreticalWidth = WIDTH * 50 / 100;
      const area2TheoreticalWidth = WIDTH * 50 / 100;
      const area3TheoreticalWidth = WIDTH * 50 / 100;
      expect(area1.clientWidth).to.be.within(
        area1TheoreticalWidth - MARGIN_OF_ERROR,
        area1TheoreticalWidth + MARGIN_OF_ERROR
      );
      expect(area2.clientWidth).to.be.within(
        area2TheoreticalWidth - MARGIN_OF_ERROR,
        area2TheoreticalWidth + MARGIN_OF_ERROR
      );
      expect(area3.clientWidth).to.be.within(
        area3TheoreticalWidth - MARGIN_OF_ERROR,
        area3TheoreticalWidth + MARGIN_OF_ERROR
      );
    });
  });

  it("Should fill the space and display the correct areas when deleting area", () => {
    cy.get("@root").contains("Ouille !");
    cy.get("@root").contains("Ola !");
    cy.get("@root").contains("Hey !");

    cy.get("@areas").then(areas => areas.$refs.areas.deleteWindow(3));

    cy.get("@root").contains("Ouille !");
    cy.get("@root").contains("Ola !");

    cy.get("@root").get(".window-container").children().get(AREA_MAIN_CLASS).should(els => {
      expect(els).to.have.length(2);
      const [area1, area2] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);

      const area1TheoreticalWidth = WIDTH * 20 / 100;
      const area2TheoreticalWidth = WIDTH * 80 / 100;
      expect(area1.clientWidth).to.be.within(
        area1TheoreticalWidth - MARGIN_OF_ERROR,
        area1TheoreticalWidth + MARGIN_OF_ERROR
      );
      expect(area2.clientWidth).to.be.within(
        area2TheoreticalWidth - MARGIN_OF_ERROR,
        area2TheoreticalWidth + MARGIN_OF_ERROR
      );
    });

    cy.get("@areas").then(areas => areas.$refs.areas.deleteWindow(1));
    cy.get("@root").contains("Ola !");

    cy.get("@root").get(AREA_MAIN_CLASS).should(els => {
      expect(els).to.have.length(1);
      const [area2] = els;

      expect(area2.clientHeight).to.equal(HEIGHT);
      expect(area2.clientWidth).to.equal(WIDTH);
    });

  });

  it('Should display the correct content after swapping areas content', () => {
    cy.get(`#${ID_PREFIX}1`).contains("Ouille !");
    cy.get(`#${ID_PREFIX}2`).contains("Ola !");
    cy.get(`#${ID_PREFIX}3`).contains("Hey !");
    cy.get("@areas").then(areas => areas.$refs.areas.swapWindows(1, 2));
    cy.get(`#${ID_PREFIX}1`).contains("Ola !");
    cy.get(`#${ID_PREFIX}2`).contains("Ouille !");
    cy.get(`#${ID_PREFIX}3`).contains("Hey !");
    cy.get("@areas").then(areas => areas.$refs.areas.swapWindows(1, 3));
    cy.get(`#${ID_PREFIX}1`).contains("Hey !");
    cy.get(`#${ID_PREFIX}2`).contains("Ouille !");
    cy.get(`#${ID_PREFIX}3`).contains("Ola !");
  })
});