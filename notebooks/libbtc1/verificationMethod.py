from multiformats import varint, multibase
from buidl.ecc import S256Point
SECP256K1_PUBLIC_KEY_PREFIX = varint.encode(0xe7)
SECP256K1_SECRET_KEY_PREFIX = varint.encode(0x1301)

MULTIKEY = "Multikey"


def get_verification_method(controller, public_key: S256Point, vm_id):
    verification_method = {
        "id": vm_id,
        "type": MULTIKEY,
        "controller": controller
    }
    public_key_bytes = public_key.sec()
    multikey_bytes = SECP256K1_PUBLIC_KEY_PREFIX + public_key_bytes
    multikey_value = multibase.encode(multikey_bytes, "base58btc")
    verification_method["publicKeyMultibase"] = multikey_value

    return verification_method


def get_key_for_verification_method(verification_method):
    type = verification_method["type"]
    if type != MULTIKEY:
        raise Exception("Not implemented - verificationMethod must be of type Multikey")
    
    public_key_multibase = verification_method["publicKeyMultibase"]
    multikey_value = multibase.decode(public_key_multibase)

    prefix = multikey_value[:2]
    if prefix != SECP256K1_PUBLIC_KEY_PREFIX:
        raise Exception("Unexpected key type")
    
    key_bytes = multikey_value[3:]

    s256_pubkey = S256Point.parse_xonly(key_bytes)
    return s256_pubkey

