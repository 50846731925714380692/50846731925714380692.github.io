
        function toBytes(str) {
            return new TextEncoder().encode(str);
        }

        function fromBytes(bytes) {
            return new TextDecoder().decode(bytes);
        }

        function hex(bytes) {
            let sb = [];

            bytes.forEach(b => sb.push((b & 0xff).toString(16).padStart(2, '0')));

            return sb.join("");
        }

        function unhex(str) {
            return Uint8Array.from(str.match(/.{2}/g), it => parseInt(it, 16));
        }

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
        crypto.subtle.digest("SHA-256", toBytes("1234"))
            .then(secret1Hash => {
                console.log("we got a hash");
                return crypto.subtle.importKey(
                    "raw",
                    new Uint8Array(secret1Hash),
                    "HKDF",
                    false,
                    ["deriveBits"]);
            })
            .then(secret1Key => {
                console.log(`imported key ${secret1Key}`)
                return crypto.subtle.deriveBits(
                    {
                        name: "HKDF",
                        hash: "SHA-256",
                        salt: crypto.getRandomValues(new Uint8Array(256 / 8)),
                        info: new ArrayBuffer(0)
                        // context:crypto.getRandomValues(new Uint8Array(256 / 8)),
                        // label:new ArrayBuffer(0)
                    },
                    secret1Key,
                    256 * 254);
            })
            .then(bits => {
                console.log(`bits derived ${bits}`)
                console.log(`len :${bits.byteLength}, ${hex(new Uint8Array(bits))}`);
            });


        // ========================// ========================// ========================// ========================// ========================
