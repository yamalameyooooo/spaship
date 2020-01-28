const shortid = require("shortid");
const mockfs = require("mock-fs");
const db_apikey = require("./db.apikey");
const config = require("../config");

// make shortid non-random while testing
jest.mock("shortid");
shortid.generate.mockResolvedValue("MOCK_KEY");

// override some configuration values
config.get = jest.fn(opt => {
  const fakeConfig = {
    webroot: "/fake/webroot"
  };
  return fakeConfig[opt];
});

// this is needed to allow console to continue working while the fs is mocked
global.console = require("../../../__mocks__/console");

describe("sync-service.db.apikey", () => {
  beforeEach(() => {
    mockfs({});
  });
  afterEach(() => {
    mockfs.restore();
  });

  describe("attach", () => {
    test("should be able to attach to the collection", async () => {
      const apikeys = await db_apikey.attach();
      expect(apikeys).toBeDefined();
    });
  });
  describe("apikey CRUD", () => {
    test("should be able to create a new api key", async () => {
      const apikeys = await db_apikey.attach();

      // special mock key for this test
      shortid.generate.mockReturnValueOnce("fake.key");

      const doc = await apikeys.createKey("fake.name");

      expect(doc).toEqual({ userid: "fake.name", apikey: "fake.key" });
    });

    test("should be able to get api keys by userid", async () => {
      const apikeys = await db_apikey.attach();
      const userid = "bigbadogre";
      const apikey = "853626948149";

      // special mock key for this test
      shortid.generate.mockReturnValueOnce(apikey);

      await apikeys.createKey(userid);

      const doc = await apikeys.getKeysByUser(userid);
      expect(doc).toMatchObject([{ userid, apikey }]);
    });

    test("should be able to get userid by apikey", async () => {
      const apikeys = await db_apikey.attach();
      const userid = "babyyoda";
      const apikey = "018265271839";

      // special mock key for this test
      shortid.generate.mockReturnValueOnce(apikey);

      await apikeys.createKey(userid);

      const doc = await apikeys.getUserByKey(apikey);
      expect(doc).toMatchObject([{ userid, apikey }]);
    });

    test("should be able to delete a key", async () => {
      const apikeys = await db_apikey.attach();
      const userid = "babyyoda";
      const apikey = "018265271839";

      // special mock key for this test
      shortid.generate.mockReturnValueOnce(apikey);

      // create key, delete it, then check for its existance

      await apikeys.createKey(userid);

      await apikeys.deleteKey(apikey);

      const doc = await apikeys.getUserByKey(apikey);
      expect(doc).not.toMatchObject([{ userid, apikey }]);
    });
    // return { getKeysByUser, getUserByKey, createKey, deleteKey };
  });
});