import "reflect-metadata";
import {Connection} from "../../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Post} from "./entity/Post";
import {MongoRepository} from "../../../../../src/repository/MongoRepository";

describe("mongodb > MongoRepository", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Post],
        enabledDrivers: ["mongodb"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("connection should return mongo repository when requested", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getMongoRepository(Post);
        postRepository.should.be.instanceOf(MongoRepository);
    })));

    it("entity manager should return mongo repository when requested", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.manager.getMongoRepository(Post);
        postRepository.should.be.instanceOf(MongoRepository);
    })));

    it("should be able to use entity cursor which will return instances of entity classes", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getMongoRepository(Post);

        // save few posts
        const firstPost = new Post();
        firstPost.title = "Post #1";
        firstPost.text = "Everything about post #1";
        await postRepository.save(firstPost);

        const secondPost = new Post();
        secondPost.title = "Post #2";
        secondPost.text = "Everything about post #2";
        await postRepository.save(secondPost);

        const cursor = postRepository.createEntityCursor({
            title: "Post #1"
        });

        const loadedPosts = await cursor.toArray();
        loadedPosts.length.should.be.equal(1);
        loadedPosts[0].should.be.instanceOf(Post);
        loadedPosts[0].id.should.be.eql(firstPost.id);
        loadedPosts[0].title.should.be.equal("Post #1");
        loadedPosts[0].text.should.be.equal("Everything about post #1");

    })));

    it("should be able to use entity cursor which will return instances of entity classes", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getMongoRepository(Post);

        // save few posts
        const firstPost = new Post();
        firstPost.title = "Post #1";
        firstPost.text = "Everything about post #1";
        await postRepository.save(firstPost);

        const secondPost = new Post();
        secondPost.title = "Post #2";
        secondPost.text = "Everything about post #2";
        await postRepository.save(secondPost);

        const loadedPosts = await postRepository.find({
            where: {
                $or: [
                    {
                        title: "Post #1",
                    },
                    {
                        text: "Everything about post #1"
                    }
                ]
            }
        });

        loadedPosts.length.should.be.equal(1);
        loadedPosts[0].should.be.instanceOf(Post);
        loadedPosts[0].id.should.be.eql(firstPost.id);
        loadedPosts[0].title.should.be.equal("Post #1");
        loadedPosts[0].text.should.be.equal("Everything about post #1");

    })));

    it("should include and exclude fields properly based on projection options", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getMongoRepository(Post);

        const post = new Post();
        post.title = "Post #1";
        post.text = "Everything about post #1";
        await postRepository.save(post);

        // Use find and findOne to demostrate that works with different find methods

        const postLoadedWithInclude = await postRepository.find({
            select: ["title"]
        });
        const postLoadedWithExclude = await postRepository.findOne({
            exclude: ["id", "text"]
        });

        postLoadedWithInclude[0].should.be.instanceOf(Post);
        postLoadedWithExclude!.should.be.instanceOf(Post);

        postLoadedWithInclude[0].title.should.be.equal("Post #1");
        postLoadedWithExclude!.title.should.be.equal("Post #1");

        postLoadedWithInclude[0].should.be.eql(postLoadedWithExclude);
    })));
});