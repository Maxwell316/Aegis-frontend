import { truncateAddress } from "./utils";

describe("truncateAddress", () => {
    it("shortens a full Stellar address, keeping start and end chars", () => {
        const address = "GBRPYHIL2CH3LFQ5I2RIK5QV6E4U6K5V7YF2UJ5A6B7C8D9E0F1G2H3I4J5K";
        expect(truncateAddress(address)).toBe("GBRPYH...4J5K");
    });

    it("returns short addresses unchanged", () => {
        expect(truncateAddress("GABCDE")).toBe("GABCDE");
    });

    it("returns addresses at the threshold length unchanged", () => {
        // startChars(6) + endChars(4) + 3 = 13
        expect(truncateAddress("ABCDEFGHIJKLM")).toBe("ABCDEFGHIJKLM");
    });

    it("truncates addresses longer than the threshold", () => {
        expect(truncateAddress("ABCDEFGHIJKLMN")).toBe("ABCDEF...KLMN");
    });

    it("returns an empty string for empty input", () => {
        expect(truncateAddress("")).toBe("");
    });

    it("honors custom start and end character counts", () => {
        expect(truncateAddress("GABCDEFGHIJKLMNOPQRSTUVWXYZ", 4, 4)).toBe("GABC...WXYZ");
    });
});
