# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createEntity, createLink, listBloodline } from '@dataconnect/generated';


// Operation CreateEntity:  For variables, look at type CreateEntityVars in ../index.d.ts
const { data } = await CreateEntity(dataConnect, createEntityVars);

// Operation CreateLink:  For variables, look at type CreateLinkVars in ../index.d.ts
const { data } = await CreateLink(dataConnect, createLinkVars);

// Operation ListBloodline: 
const { data } = await ListBloodline(dataConnect);


```