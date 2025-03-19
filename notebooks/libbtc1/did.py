from .bech32 import encode_bech32_identifier, decode_bech32_identifier
from.verificationMethod import get_verification_method
from buidl.ecc import S256Point

MAINNET="mainnet"
SIGNET="signet"
TESTNET="testnet"
REGNET="regtest"

NETWORKS = [MAINNET,SIGNET,TESTNET, REGNET]

VERSIONS = [1]

EXTERNAL = "external"
KEY = "key"

P2PKH = "p2pkh"
P2WPKH = "p2wpkh"
P2TR = "p2tr"

SINGLETON_BEACON_TYPE = "SingletonBeacon"

CONTEXT = ["https://www.w3.org/ns/did/v1", "https://did-btc1/TBD/context"]

def create_deterministic(public_key, network=None, version=None):
    if network != None and network not in NETWORKS:
        raise Exception(f"Invalid Network : {network}")
    
    if version != None and version not in VERSIONS:
        raise Exception(f"Invalid Version : {version}")

    versionStr = "" if version == None else f":{version}"
    networkStr = "" if network == None else f":{network}"

    sec_pubkey = public_key.sec()
    bech32_id = encode_bech32_identifier(KEY, sec_pubkey)

    did_btc1 = f"did:btc1{versionStr}{networkStr}:{bech32_id}"
    did_document = resolve(did_btc1)

    return did_btc1, did_document



def resolve(did_btc1):
    did_chunks = did_btc1.split(":")

    if len(did_chunks) < 3:
        raise Exception(f"Invalid DID: {did_btc1}")
    
    assert did_chunks[0] == "did", f"Invalid DID: {did_btc1}. No did scheme."
    assert did_chunks[1] == "btc1", f"Invalid DID: {did_btc1}. Method is not btc1."
    
    version = None
    network = None
    bech32_id = None

    if len(did_chunks) == 3:
        bech32_id = did_chunks[2]
        version = 1
        network = "mainnet"
    elif len(did_chunks) == 4:
        try:
            version = int(did_chunks[2])
            network = MAINNET
        except:
            network = did_chunks[2]
            version = 1

        bech32_id = did_chunks[3]
    elif len(did_chunks) == 5:
        version = int(did_chunks[1])
        network = did_chunks[3]
        bech32_id = did_chunks[4]
    else:
        raise Exception(f"Invalid DID: {did_btc1}. Too many identifier components.")

    assert version in VERSIONS, f"Invalid DID: {did_btc1}. Version {version} not recognised."
    assert network in NETWORKS, f"Invalid DID: {did_btc1}. Network {network} not recognised."

    hrp, identifier_bytes = decode_bech32_identifier(bech32_id)

    identifierComponents = {
        "version": version,
        "network": network,
        "hrp": hrp,
        "genesisBytes": identifier_bytes
    }

    if hrp == "k":
        initial_did_document = resolve_deterministic(did_btc1, identifierComponents)
    elif type == EXTERNAL:
        raise NotImplemented
    
    # TODO: Process Beacon Signals

    did_document = initial_did_document
    
    return did_document



def resolve_deterministic(did_btc1, identifier_components):
    key_bytes = identifier_components["genesisBytes"]
    network = identifier_components["network"]
    did_document = {}
    did_document["id"] = did_btc1
    did_document["@context"] = CONTEXT

    initial_key = S256Point.parse_sec(key_bytes)

    vm_id = "#initialKey"
    vm = get_verification_method(did_btc1, initial_key, vm_id)

    did_document["verificationMethod"] = [vm]

    did_document["authentication"] = [vm_id]
    did_document["assertionMethod"] = [vm_id]
    did_document["capabilityInvocation"] = [vm_id]
    did_document["capabilityDelegation"] = [vm_id]

    did_document["service"] = deterministically_generate_beacon_services(initial_key, network)
    return did_document

def deterministically_generate_beacon_services(pubkey: S256Point, network):
    p2pkh_beacon = generate_singleton_beacon_service(pubkey, "#initial_p2pkh",P2PKH,network)
    p2wpkh_beacon = generate_singleton_beacon_service(pubkey, "#initial_p2wpkh",P2WPKH,network)
    p2tr_beacon = generate_singleton_beacon_service(pubkey, "#initial_p2tr",P2TR,network)
    service = [p2pkh_beacon, p2wpkh_beacon, p2tr_beacon]
    return service

def generate_singleton_beacon_service(pubkey: S256Point, service_id, address_type, network):
    if address_type == P2PKH:
        address = pubkey.p2pkh_script().address(network)
    elif address_type == P2WPKH:
        address = pubkey.p2wpkh_address(network=network)
    elif address_type == P2TR:
        address = pubkey.p2tr_address(network=network)
    else:
        raise Exception(f"Address Type {address_type} Not recognised")
    
    bip21_address_uri = f"bitcoin:{address}"
    beacon_service = {
        "id": service_id,
        "type": SINGLETON_BEACON_TYPE,
        "serviceEndpoint": bip21_address_uri
    }

    return beacon_service


