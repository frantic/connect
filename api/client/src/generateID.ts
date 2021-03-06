/**
 * Generates a new string ID which is:
 *
 * - Roughly ordered by time even for IDs generated by different clients.
 * - base32 encoded which allows them to be used anywhere alphanumeric strings
 *   are accepted.
 * - Not susceptible to the [German tank problem][1] which allows a 3rd party
 *   to estimate the number of IDs being generated by comparing two IDs.
 *
 * Based jointly on [Firebase push IDs][2], [Segment KSUIDs][3], and the
 * [ULID spec][4].
 *
 * **Representation**
 *
 * Our ID representation mixes the Firebase and ULID representation.
 *
 * - 108 bits total
 * - 48 bit timestamp (in milliseconds)
 * - 60 bits of randomness
 *
 * We use [Crockford’s base32][5] lowercase encoding. This alphabet excludes
 * I, L, O, and U to avoid confusion and abuse with obscene words. We use
 * lowercase letters so that our IDs vary in height and don’t completely
 * capture attention when used in, say, a URL.
 *
 * ULID uses 80 bits of randomness to match the length of a UUID. We don’t care
 * about matching the length of a UUID. Since Firebase has shown 72 bits of
 * randomness is sufficient we go with that.
 *
 * **Concerns**
 *
 * - Client side clocks can be out of sync. If client A and client B have clocks
 *   that are out of sync then they may generate out-of-order IDs. We can
 *   mitigate this by asking our API to send us a timestamp so we can sync up
 *   our client clock.
 *
 * - We use 60 bits of randomness whereas ULID uses 80 and Firebase uses 72.
 *   initially when writing this algorithm, I (@calebmer) thought I was using
 *   72 bits of randomness like Firebase. However, I did the math in the
 *   implementation wrong. I was counting base64 encoded bits for 12 characters
 *   (bits in a base64 character: 2 ^ 6 = 64; bits in 12 base64 characters: 6 * 12 = 72)
 *   instead of base32 encoded bits for 12 characters (bits in a base32
 *   character: 2 ^ 5 = 32; bits in 12 base32 characters: 5 * 12 = 60). Since
 *   that mistake, this algorithm has been shipped to production and numerous places
 *   in the code expect an ID that is 22 characters long. For now, I’m fine with
 *   tolerating only 60 bits of randomness. If we ever start seeing collisions then
 *   maybe it will be time to reconsider the algorithm.
 *
 * [1]: https://en.wikipedia.org/wiki/German_tank_problem
 * [2]: https://firebase.googleblog.com/2015/02/the-2120-ways-to-ensure-unique_68.html
 * [3]: https://github.com/segmentio/ksuid
 * [4]: https://github.com/ulid/spec
 * [5]: https://www.crockford.com/base32.html
 */
export function generateID<ID extends string>(): ID {
  // Implementation heavily inspired by:
  // https://github.com/ulid/javascript/blob/5e9727b527aec5b841737c395a20085c4361e971/lib/index.ts

  let id = "";

  let now = Date.now();
  for (let i = 0; i < 10; i++) {
    const mod = now % 32;
    id = ENCODING[mod] + id;
    now = (now - mod) / 32;
  }

  for (let i = 0; i < 12; i++) {
    // I (@calebmer) am not worried right now about cryptographically secure
    // random numbers. Even if an attacker were able to guess an ID they still
    // shouldn’t be able to see content they don’t have access to.
    id += ENCODING[Math.floor(Math.random() * 32)];
  }

  return id as ID;
}

const ENCODING = "0123456789abcdefghjkmnpqrstvwxyz"; // Crockford’s base32
