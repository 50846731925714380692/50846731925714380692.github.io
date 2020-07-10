// All buffer transformations are Uint8Array-s

function hex(bytes) {
    let sb = [];

    bytes.forEach(b => sb.push((b & 0xff).toString(16).padStart(2, '0'))); // if uint8 can remove the mask

    return sb.join("");
}

function unhex(str) {
    return Uint8Array.from(str.match(/.{2}/g), it => parseInt(it, 16));
}

function toBytes(str) {
    return new TextEncoder().encode(str);
}

function fromBytes(bytes) {
    return new TextDecoder().decode(bytes);
}

// Uint8Array.prototype.hex = function () {
//     return hex(this);
// }
//
// Uint8Array.prototype.toString = function () {
//     return fromBytes(this);
// }
Object.assign(Uint8Array.prototype, {
    hex() {
        return hex(this);
    },
    toString() {
        return fromBytes(this);
    }
});
// String.prototype.unhex = function () {
//     return unhex(this);
// }
//
// String.prototype.toBytes = function () {
//     return toBytes(this);
// }
Object.assign(String.prototype, {
    unhex() {
        return unhex(this);
    },
    toBytes() {
        return toBytes(this);
    }
})

function digest(bytes) {
    return crypto.subtle.digest("SHA-512", bytes).then(buf => new Uint8Array(buf));
}

function random(len) {
    return crypto.getRandomValues(new Uint8Array(len));
}

function randomPbkdf(len) {
    return crypto.subtle.importKey("raw", random(len), "PBKDF2", false, ["deriveBits"])
        .then(key => crypto.subtle.deriveBits(
            {
                name: "PBKDF2",
                hash: "SHA-512",
                salt: new Int8Array(random(64)),
                iterations: 2
            },
            key,
            len * 8))
        .then(buf => new Uint8Array(buf));
}

function encrypt(s1, s2) {
    let salt
    let iv

    return Promise.all([randomPbkdf(64), randomPbkdf(16)])
        .then(([s, i]) => {
            salt = s;
            iv = i;
            return digest(s1.toBytes());
        })
        .then(s1d => crypto.subtle.importKey("raw", s1d, "PBKDF2", false, ["deriveKey"]))
        .then(s1k => crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                hash: "SHA-512",
                salt: salt,
                iterations: 100_000
            },
            s1k,
            {
                name: "AES-CBC",
                length: 256
            },
            false,
            ["encrypt"]))
        .then(s1dk => Promise.all([s1dk, digest(s2.toBytes())]))
        .then(([s1dk, data]) => crypto.subtle.encrypt(
            {
                name: "AES-CBC",
                iv: iv
            },
            s1dk,
            data))
        .then(data => ({
            salt: salt.hex(),
            iv: iv.hex(),
            data: new Uint8Array(data).hex()
        }))
}

function decrypt(s, o) {
    digest(s.toBytes())
        .then(sd => crypto.subtle.importKey("raw", sd, "PBKDF2", false, ["deriveKey"]))
        .then(sk => crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                hash: "SHA-512",
                salt: o.salt.unhex(),
                iterations: 100_000
            },
            sk,
            {
                name: "AES-CBC",
                length: 256
            },
            false,
            ["decrypt"]))
        .then(sdk => crypto.subtle.decrypt(
            {
                name: "AES-CBC",
                iv: o.iv.unhex()
            },
            sdk,
            o.data.unhex()
        ))
        .then(buf => new Uint8Array(buf));
}

async function tests() {
    let dig = await digest("1234".toBytes());
    console.log(dig);

    let rpbkf = (await randomPbkdf(10)).hex();
    console.log(rpbkf);
    console.log(rpbkf.unhex());

    let result = await encrypt("1234", "5678");
    console.log(result);
}

tests()
//
// /// tests
// const salt = [53, 17, -83, 116, -56, -28, 92, 96, 11, 120, 99, -14, 19, 109, -73, -120]
// // const salt = crypto.getRandomValues(new Uint8Array(8))
//
// console.log(salt)
// console.log(hex(salt))
// console.log(unhex(hex(salt)))
// const str = "kazvam sa даниел соколду"
// console.log(str);
// console.log(toBytes(str));
// console.log(fromBytes(toBytes(str)));
// console.log(hex(toBytes(str)));
// console.log(unhex(hex(toBytes(str))));
// console.log(fromBytes(unhex(hex(toBytes(str)))));
//
// ========================// ========================// ========================// ========================// ========================
// pbkdf2 example
// const pass = "1234"
//
// let pbkdf2 = {
//     name: "PBKDF2",
//     hash: "SHA-256",
//     salt: new Int8Array(salt),
//     iterations: 100000
// };
//
// crypto.subtle.importKey("raw", toBytes("1234"), "PBKDF2", false, ["deriveBits"])
//     .then(res => {
//         console.log(res);
//         return crypto.subtle.deriveBits(pbkdf2, res, 256);
//     }).then(deriv => {
//     console.log(deriv);
//     console.log(new Int8Array(deriv));
// });
//
// crypto.subtle.generateKey(
//     {
//         name: "HMAC",
//         hash: {name: "SHA-512"},
//         length: 2048
//     },
//     true,
//     ["sign", "verify"]
// ).then(key => {
//     console.log(key);
//     crypto.subtle.exportKey("raw", key).then(buf => {
//         console.log("Finally the generated is exported")
//         console.log(new Int8Array(buf));
//         console.log(hex(new Uint8Array(buf)));
//     })
// })
//
// console.log("the hash everyone");
// crypto.subtle.digest("SHA-256", toBytes("9011divies")).then(it => console.log(new Int8Array(it)));
//
// const input1 = "secret1"
// const input2 = "secret2.should.be.longer.and.thus.stronger"
//
//
// function saltGenerate() {
//
// }

// ========================// ========================// ========================// ========================// ========================
// hkdf example
// crypto.subtle.digest("SHA-256", toBytes("1234"))
//     .then(secret1Hash => {
//         console.log("we got a hash");
//         return crypto.subtle.importKey(
//             "raw",
//             new Uint8Array(secret1Hash),
//             "HKDF",
//             false,
//             ["deriveBits"]);
//     })
//     .then(secret1Key => {
//         console.log(`imported key ${secret1Key}`)
//         return crypto.subtle.deriveBits(
//             {
//                 name: "HKDF",
//                 hash: "SHA-256",
//                 salt: crypto.getRandomValues(new Uint8Array(256 / 8)),
//                 info: new ArrayBuffer(0)
//                 // context:crypto.getRandomValues(new Uint8Array(256 / 8)),
//                 // label:new ArrayBuffer(0)
//             },
//             secret1Key,
//             256 * 254);
//     })
//     .then(bits => {
//         console.log(`bits derived ${bits}`)
//         console.log(`len :${bits.byteLength}, ${hex(new Uint8Array(bits))}`);
//     });
//

// ========================// ========================// ========================// ========================// ========================


// function abc() {
//     let a = 0;
//     let b = 0;
//
//     return new Promise(resolve => setTimeout(() => resolve(), 1000))
//         .then(() => {
//             a = a + 1;
//             return new Promise(resolve => setTimeout(() => resolve(), 1000));
//         }).then(() => {
//             b = b + 2;
//             return new Promise(resolve => setTimeout(() => resolve(), 1000));
//         }).then(() => new Promise(resolve => setTimeout(() => resolve(a + b), 1000)))
//     // }).then(() => console.log(a + b))
// }
//
// abc().then(x => console.log(x)).catch(e => console.log(e));
