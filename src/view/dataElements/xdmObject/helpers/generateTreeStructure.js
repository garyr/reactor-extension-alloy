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

import { WHOLE } from "../constants/populationStrategy";
import { ARRAY, OBJECT } from "../constants/schemaType";

/**
 * The model representing a node on the XDM tree.
 * @typedef {Object} TreeNode
 * @property {string} id A unique identifier for the node.
 * @property {string} displayName A user-friendly display for the node.
 * @property {string} type The JSON type that the node's value must be
 * @property {boolean} disabled Whether the user should be disallowed
 * from providing a value for the node.
 * @property {boolean} isPopulated Whether the node or one of its
 * descendants has been given a value.
 * @property {string} error If an error should be shown for the node,
 * this will be the error message.
 * @property {Array} children Children tree nodes, if any.
 */

/**
 * Generates an object representing a node on the XDM tree. The node
 * may contain child nodes.
 * @param {FormStateNode} formStateNode A node from the form state.
 * @param {string} [displayName] A user-friendly display name for the node.
 * @param {boolean} [isAncestorUsingWholePopulationStrategy=false] Whether any ancestor
 * node is using the WHOLE population strategy. If this is true, this node will
 * be disabled.
 * @param {Function} [notifyParentOfDataPopulation] When called, notifies the
 * parent node that this node or a descendant of this node has been populated
 * with a value by the user.
 * @param {Function} [notifyParentOfTouched] When called, notifies the parent
 * node that the "whole value" field of this node or a descendant node has
 * been touched by the user. This helps determine if validation errors should
 * be shown for the node. "Touched" here is according to Formik's definition.
 * @param {Object} [errors] Errors that were collected during validation.
 * The structure of the errors object matches the structure of the
 * formStateNode, though only properties with errors will exist.
 * @param {Object} [touched] A record of which fields have been touched by
 * the user. The structure of the touched object matches the structure of
 * formStateNode. "Touched" here is according to Formik's definition.
 * @returns TreeNode
 */
const getTreeNode = ({
  formStateNode,
  displayName,
  isAncestorUsingWholePopulationStrategy = false,
  notifyParentOfDataPopulation = () => {},
  notifyParentOfTouched = () => {},
  errors,
  touched
}) => {
  const {
    id,
    schema,
    populationStrategy,
    wholeValue,
    properties,
    items,
    isAlwaysDisabled,
    isAutoPopulated
  } = formStateNode;

  const node = {
    id,
    displayName,
    type: schema.type,
    disabled: isAlwaysDisabled || isAncestorUsingWholePopulationStrategy,
    isPopulated: false
  };

  const isUsingWholePopulationStrategy = populationStrategy === WHOLE;

  let isTouchedAtCurrentOrDescendantNode = false;

  const confirmDataPopulatedAtCurrentOrDescendantNode = () => {
    if (!node.isPopulated) {
      notifyParentOfDataPopulation();
      node.isPopulated = true;
    }
  };

  if (isAutoPopulated) {
    confirmDataPopulatedAtCurrentOrDescendantNode();
  }

  const confirmTouchedAtCurrentOrDescendantNode = () => {
    if (!isTouchedAtCurrentOrDescendantNode) {
      notifyParentOfTouched();
      isTouchedAtCurrentOrDescendantNode = true;
    }
  };

  if (touched && touched.wholeValue) {
    confirmTouchedAtCurrentOrDescendantNode();
  }

  if (
    !isAncestorUsingWholePopulationStrategy &&
    isUsingWholePopulationStrategy &&
    wholeValue
  ) {
    confirmDataPopulatedAtCurrentOrDescendantNode();
  }

  if (schema.type === OBJECT && properties) {
    const propertyNames = Object.keys(properties);
    if (propertyNames.length) {
      node.children = propertyNames.sort().map(propertyName => {
        const propertyFormStateNode = properties[propertyName];
        const childNode = getTreeNode({
          formStateNode: propertyFormStateNode,
          displayName: propertyName,
          isAncestorUsingWholePopulationStrategy:
            isAncestorUsingWholePopulationStrategy ||
            isUsingWholePopulationStrategy,
          notifyParentOfDataPopulation: confirmDataPopulatedAtCurrentOrDescendantNode,
          notifyParentOfTouched: confirmTouchedAtCurrentOrDescendantNode,
          errors:
            errors && errors.properties
              ? errors.properties[propertyName]
              : undefined,
          touched:
            touched && touched.properties
              ? touched.properties[propertyName]
              : undefined
        });
        return childNode;
      });
    }
  }

  if (schema.type === ARRAY && items && items.length) {
    node.children = items.map((itemFormStateNode, index) => {
      const childNode = getTreeNode({
        formStateNode: itemFormStateNode,
        displayName: `Item ${index + 1}`,
        isAncestorUsingWholePopulationStrategy:
          isAncestorUsingWholePopulationStrategy ||
          isUsingWholePopulationStrategy,
        notifyParentOfDataPopulation: confirmDataPopulatedAtCurrentOrDescendantNode,
        notifyParentOfTouched: confirmTouchedAtCurrentOrDescendantNode,
        errors: errors && errors.items ? errors.items[index] : undefined,
        touched: touched && touched.items ? touched.items[index] : undefined
      });
      return childNode;
    });
  }

  if (isTouchedAtCurrentOrDescendantNode) {
    node.error =
      errors && typeof errors.wholeValue === "string"
        ? errors.wholeValue
        : undefined;
  }

  return node;
};

// Avoid exposing all of getTreeNode's parameters since
// they're only used internally for recursion.
export default ({ formState, errors, touched }) => {
  return getTreeNode({ formStateNode: formState, errors, touched });
};
