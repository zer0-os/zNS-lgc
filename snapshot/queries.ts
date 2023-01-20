import { gql } from "@apollo/client/core";


/**
 * A domain owner may not currently hold a domain, but they are listed
 * here historically as they will have owned one at one point
 */
export const getAllDomainOwners = gql`
query DomainOwners ($first: Int!, $skip: Int!) {
  accounts(first: $first, skip: $skip) {
    id
    ownedDomains(first: 1000) {
      id
      name
      label
      metadata
    }
  }
}
`

export const getSpecificDomainOwner = gql`
query DomainOwner ($first: Int!, $skip: Int!, $id: ID!) {
  account(id: $id) {
    id
    ownedDomains(first: $first, skip: $skip) {
      id
      name
      label
      metadata
    }
  }
}
`
