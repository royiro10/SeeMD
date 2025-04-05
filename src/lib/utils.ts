const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const base32Lookup: Record<string, number> = {};
base32Alphabet.split('').forEach((char, i) => base32Lookup[char] = i);

// Encode Unicode string to Base32
export function encodeUnicode(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let bits = '';
    for (const byte of bytes) {
        bits += byte.toString(2).padStart(8, '0');
    }

    let base32 = '';
    for (let i = 0; i < bits.length; i += 5) {
        const chunk = bits.substring(i, i + 5);
        base32 += base32Alphabet[parseInt(chunk.padEnd(5, '0'), 2)];
    }

    // Optionally pad to a multiple of 8 characters (RFC 4648)
    while (base32.length % 8 !== 0) {
        base32 += '=';
    }

    return base32;
}

// Decode Base32 to Unicode string
export function decodeUnicode(base32: string): string {
    base32 = base32.replace(/=+$/, '').toUpperCase(); // Remove padding
    let bits = '';

    for (const char of base32) {
        const value = base32Lookup[char];
        if (value === undefined) {
            throw new Error(`Invalid Base32 character: ${char}`);
        }
        bits += value.toString(2).padStart(5, '0');
    }

    const bytes: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
        const byte = bits.substring(i, i + 8);
        if (byte.length === 8) {
            bytes.push(parseInt(byte, 2));
        }
    }

    return new TextDecoder().decode(new Uint8Array(bytes));
}

