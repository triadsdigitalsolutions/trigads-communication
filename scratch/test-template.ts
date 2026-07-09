import { createTemplateAction } from "../src/app/actions/whatsapp";

async function test() {
    console.log("Testing createTemplateAction...");
    const res = await createTemplateAction({
        name: "test_template",
        category: "MARKETING",
        language: "en_US",
        components: [
            { type: "BODY", text: "Hello world" }
        ]
    });
    console.log(res);
}

test();
