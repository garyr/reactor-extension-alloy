/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const PLATFORM_HOST = "https://platform.adobe.io";

const getBaseRequestHeaders = ({ orgId, imsAccess }) => {
  return {
    "x-api-key": "Activation-DTM",
    "x-gw-ims-org-id": orgId,
    Authorization: `Bearer ${imsAccess}`,
    "Content-Type": "application/json"
  };
};

/*
const fetchSchema = ({ baseRequestHeaders, schemaRef }) => {
  const schemaMajorVersion = getMajorVersionFromSchemaRefContentType(
    schemaRef.contentType
  );
  return fetch(
    `${PLATFORM_HOST}/data/foundation/schemaregistry/tenant/schemas/${encodeURIComponent(
      schemaRef.id
    )}`,
    {
      headers: {
        ...baseRequestHeaders,
        // The first part of this ensures all json-schema refs are resolved within the schema we retrieve.
        Accept: `application/vnd.adobe.xed-full+json;version=${schemaMajorVersion}`
      }
    }
  )
    .then(response => response.json())
    .then(responseBody => responseBody);
};
*/

export default ({ orgId, imsAccess }) => {
  const baseRequestHeaders = getBaseRequestHeaders({ orgId, imsAccess });

  // TODO: paginate this response using on responseBody._page.count or responseBody._links.next
  return fetch(
    `${PLATFORM_HOST}/data/foundation/schemaregistry/global/classes?orderby=title`,
    {
      headers: {
        // request a summary response with title , $id , meta:altId , and version attributes
        accept: "application/vnd.adobe.xed-id+json",
        ...baseRequestHeaders
      }
    }
  )
    .then(response => {
      if (!response.ok) {
        // TODO
      }
      return response.json();
    })
    .then(responseBody => {
      return responseBody.results;
    });
};