/*
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const getNameByPropertyId = (instances, propertyId) => {
  let matchingName;
  for (let i = 0; i < instances.length; i += 1) {
    const instance = instances[i];
    if (instance.propertyId === propertyId) {
      matchingName = instance.name;
      break;
    }
  }
  return matchingName;
};

module.exports = (window, runAlloy) => {
  const { instances } = turbine.getExtensionSettings();
  const names = instances.map(instance => instance.name);

  runAlloy(names);

  instances.forEach(({ name, ...options }) => {
    window[name]("configure", options);
  });

  return {
    getInstance(propertyId) {
      const name = getNameByPropertyId(instances, propertyId);
      return name ? window[name] : undefined;
    }
  };
};
