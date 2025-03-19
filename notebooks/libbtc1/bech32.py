from buidl.bech32 import bc32encode, BECH32_ALPHABET, encode_bech32, convertbits, bech32m_create_checksum, bech32m_verify_checksum
from buidl.helper import int_to_big_endian
PREFIX = {
    "key": "k",
    "external": "x"
}

TYPE_FOR_PREFIX = {v: k for k, v in PREFIX.items()}


def encode_bech32_identifier(type, value):
    prefix = PREFIX.get(type)
    data = convertbits(value, 8, 5)
    checksum = bech32m_create_checksum(prefix, data)
    encoded = encode_bech32(data + checksum)

    return prefix + "1" + encoded

def decode_bech32_identifier(value):
    hrp, raw_data = value.split("1")

    type = TYPE_FOR_PREFIX.get(hrp)
    if not type:
        raise ValueError(f"unknown human readable part: {hrp}")
    
    data = [BECH32_ALPHABET.index(c) for c in raw_data]

    if not bech32m_verify_checksum(hrp, data):
        raise ValueError(f"bad bech32 encoding: {value}")
    
    # Remove checksum
    data = data[0:-6]
    
    # number = 0
    # for digit in data[1:-6]:
    #     number = (number << 5) + digit
    # num_bytes = (len(data) - 7) * 5 // 8
    # bits_to_ignore = (len(data) - 7) * 5 % 8
    # number >>= bits_to_ignore
    # identifier = int_to_big_endian(number, num_bytes)
    # if num_bytes < 2 or num_bytes > 40:
    #     raise ValueError(f"bytes out of range: {num_bytes}")
    identifier = bytes(convertbits(data, 5, 8, False))

    return [hrp, identifier]
    



