---
lang: en
...

# did:btc1 DID Method Specification

## did:btc1 DID Method Specification {.unnumbered .unlisted}

### Authors: {.unnumbered .unlisted}

::: {.unformattedTable}
------------- ------------------------ ---------------------------------------------------
Ryan Grant    <rgrant@contract.design> [Digital Contract Design](https://contract.design/)
Will Abramson <will@legreq.com>        [Legendary Requirements](https://legreq.com/) 
Joe Andrieu   <joe@legreq.com>         [Legendary Requirements](https://legreq.com/)       
Kevin Dean    <kevin@legreq.com>       [Legendary Requirements](https://legreq.com/)       
Dan Pape      <dpape@contract.design>  [Digital Contract Design](https://contract.design/) 
Jennie Meier  <jennie@contract.design> [Digital Contract Design](https://contract.design/) 
------------- ------------------------ ---------------------------------------------------
:::

### Contributors: {.unnumbered .unlisted}

::: {.unformattedTable}
------------- ------------------------ ---------------------------------------------------
Kate Sills    <katelynsills@gmail.com> 
------------- ------------------------ ---------------------------------------------------
:::

### Publication Date: 20th September 2024 {.unnumbered .unlisted}

---
WARNING: This specification is still under active development and may be subject to breaking
changes. Once we have finalized the specification text a stable v1.0 of the specification 
will be published.
---

### Copyright &copy; 2024 Digital Contract Design {.unnumbered .unlisted}

### Licence Statement: This specification is covered by the [Mozilla Public License Version 2.0](https://github.com/dcdpr/did-btc1/blob/main/LICENSE).

### Abstract {.unnumbered .unlisted}

**did:btc1** is a censorship-resistant Decentralized Identifier (DID) method 
using the Bitcoin blockchain as a Verifiable Data Registry to announce changes 
to the DID document. It improves on prior work by allowing: zero-cost off-chain 
DID creation; aggregated updates for scalable on-chain update costs; long-term 
identifiers that can support frequent updates; private communication of the 
DID document; private DID resolution; and non-repudiation appropriate for 
serious contracts.
