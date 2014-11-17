// Generated by CoffeeScript 1.6.3
(function() {
  var RedisTagging, should, _;

  should = require("should");

  RedisTagging = require("../index");

  _ = require("lodash");

  describe('Redis-Tagging Test', function() {
    var bucket1, bucket2, rt;
    rt = null;
    bucket1 = "test";
    bucket2 = "TEST";
    before(function(done) {
      done();
    });
    after(function(done) {
      done();
    });
    it('get a RedisTagging instance', function(done) {
      rt = new RedisTagging();
      rt.should.be.an.instanceOf(RedisTagging);
      done();
    });
    describe('Basics', function() {
      it('Set tags for an item with non numeric score: FAILS', function(done) {
        rt.set({
          bucket: bucket1,
          id: "123",
          score: "dfgs",
          tags: ["just", "testing"]
        }, function(err, resp) {
          err.message.should.equal("Invalid score format");
          done();
        });
      });
      it('Set tags for an item with tags missing: FAILS', function(done) {
        rt.set({
          bucket: bucket1,
          id: "123"
        }, function(err, resp) {
          err.message.should.equal("No tags supplied");
          done();
        });
      });
      it('Set tags for an item with tags not being an array: FAILS', function(done) {
        rt.set({
          bucket: bucket1,
          id: "123",
          tags: "string..."
        }, function(err, resp) {
          err.message.should.equal("Invalid tags format");
          done();
        });
      });
      it('Set tags for an item "123" but do not supply a single tag', function(done) {
        rt.set({
          bucket: bucket1,
          id: "123",
          tags: []
        }, function(err, resp) {
          should.not.exist(err);
          resp.should.equal(true);
          done();
        });
      });
      it('Set tags for an item "123"', function(done) {
        rt.set({
          bucket: bucket1,
          id: "123",
          tags: ["just", "testing"]
        }, function(err, resp) {
          should.not.exist(err);
          resp.should.equal(true);
          done();
        });
      });
      it('Get tags without supplying an id', function(done) {
        rt.get({
          bucket: bucket1
        }, function(err, resp) {
          err.message.should.equal("No id supplied");
          done();
        });
      });
      it('Get tags without supplying a bucket or id', function(done) {
        rt.get({}, function(err, resp) {
          err.message.should.equal("No bucket supplied");
          done();
        });
      });
      it('Get tags for this item "123"', function(done) {
        rt.get({
          bucket: bucket1,
          id: "123"
        }, function(err, resp) {
          should.not.exist(err);
          resp.should.containEql('just');
          resp.should.containEql('testing');
          done();
        });
      });
      it('Delete this item "123"', function(done) {
        rt.remove({
          bucket: bucket1,
          id: "123"
        }, function(err, resp) {
          should.not.exist(err);
          resp.should.equal(true);
          done();
        });
      });
      it('Make sure this item is gone "123"', function(done) {
        rt.get({
          bucket: bucket1,
          id: "123"
        }, function(err, resp) {
          should.not.exist(err);
          resp.length.should.equal(0);
          done();
        });
      });
      it('Get all IDs for this bucket: []', function(done) {
        rt.allids({
          bucket: bucket1
        }, function(err, resp) {
          should.not.exist(err);
          resp.length.should.equal(0);
          done();
        });
      });
      it('Set tags for an item, again "123"', function(done) {
        rt.set({
          bucket: bucket1,
          id: "123",
          score: 10,
          tags: ["just", "testing", "all"]
        }, function(err, resp) {
          should.not.exist(err);
          resp.should.equal(true);
          done();
        });
      });
      it('Get all IDs for this bucket: ["123"]', function(done) {
        rt.allids({
          bucket: bucket1
        }, function(err, resp) {
          should.not.exist(err);
          resp.length.should.equal(1);
          resp[0].should.equal("123");
          done();
        });
      });
      it('Set tags for an item with extended chars "456"', function(done) {
        rt.set({
          bucket: bucket1,
          id: "456",
          score: 10,
          tags: ["äöüÖÄÜ§$%& ,.-+#áéóíáà~", "   testing   ", "all"]
        }, function(err, resp) {
          should.not.exist(err);
          resp.should.equal(true);
          done();
        });
      });
      it('Get tags for this item "456"', function(done) {
        rt.get({
          bucket: bucket1,
          id: "456"
        }, function(err, resp) {
          should.not.exist(err);
          resp.should.containEql('äöüÖÄÜ§$%& ,.-+#áéóíáà~');
          resp.should.containEql('   testing   ');
          done();
        });
      });
      it('Get all IDs for this bucket: ["123","456"]', function(done) {
        rt.allids({
          bucket: bucket1
        }, function(err, resp) {
          should.not.exist(err);
          resp.length.should.equal(2);
          resp.should.containEql("123");
          resp.should.containEql("456");
          done();
        });
      });
      it('Get all IDs for the tag []: []', function(done) {
        rt.tags({
          bucket: bucket1,
          tags: []
        }, function(err, resp) {
          should.not.exist(err);
          resp.total_items.should.equal(0);
          resp.limit.should.equal(100);
          resp.offset.should.equal(0);
          resp.items.should.be.empty;
          done();
        });
      });
      it('Get all IDs for the tag ["testing"]: ["123"]', function(done) {
        rt.tags({
          bucket: bucket1,
          tags: ["testing"]
        }, function(err, resp) {
          should.not.exist(err);
          resp.total_items.should.equal(1);
          resp.limit.should.equal(100);
          resp.offset.should.equal(0);
          resp.items.should.containEql("123");
          done();
        });
      });
      it('Get all IDs for the tag ["all"]: ["123", "456"]', function(done) {
        rt.tags({
          bucket: bucket1,
          tags: ["all"]
        }, function(err, resp) {
          should.not.exist(err);
          resp.total_items.should.equal(2);
          resp.limit.should.equal(100);
          resp.offset.should.equal(0);
          resp.items.should.containEql("123");
          resp.items.should.containEql("456");
          done();
        });
      });
      it('Get all IDs for the tag intersection ["all","testing"]: ["123"]', function(done) {
        rt.tags({
          bucket: bucket1,
          tags: ["all", "testing"]
        }, function(err, resp) {
          should.not.exist(err);
          resp.total_items.should.equal(1);
          resp.limit.should.equal(100);
          resp.offset.should.equal(0);
          resp.items.should.containEql("123");
          done();
        });
      });
      it('Get all IDs for the tag intersection ["all","testing"]: ["123"]', function(done) {
        rt.tags({
          bucket: bucket1,
          tags: ["all", "testing"],
          type: "union"
        }, function(err, resp) {
          should.not.exist(err);
          resp.total_items.should.equal(2);
          resp.limit.should.equal(100);
          resp.offset.should.equal(0);
          resp.items.should.containEql("123", "456");
          done();
        });
      });
      it('Get the 2 toptags', function(done) {
        rt.toptags({
          bucket: bucket1,
          amount: 2
        }, function(err, resp) {
          should.not.exist(err);
          resp.total_items.should.equal(5);
          resp.items[0].tag.should.equal("all");
          resp.items[0].count.should.equal(2);
          done();
        });
      });
      it('Get all buckets', function(done) {
        rt.buckets(function(err, resp) {
          should.not.exist(err);
          resp.should.containEql("test");
          done();
        });
      });
    });
    describe('CLEANUP', function() {
      return it('Remove bucket "test"', function(done) {
        rt.removebucket({
          bucket: bucket1
        }, function(err, resp) {
          should.not.exist(err);
          resp.should.equal(true);
          done();
        });
      });
    });
  });

}).call(this);
