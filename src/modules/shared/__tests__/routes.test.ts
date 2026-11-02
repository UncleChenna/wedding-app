import { readdirSync } from "node:fs";
import { join, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { appRoutes, invitationHref, passHref, pageRouteSamples, routeList } from "../lib/routes";

describe("application route contract", () => {
  it("registers every actual page, including dynamic and preview routes", () => {
    const pages = readdirSync(join(process.cwd(), "src/app"), { recursive: true, encoding: "utf8" })
      .filter((file) => file === "page.tsx" || file.endsWith(sep + "page.tsx"))
      .map(
        (file) =>
          "/" +
          file
            .split(sep)
            .slice(0, -1)
            .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")))
            .join("/"),
      );
    expect(routeList.map((route) => route.path).sort()).toEqual(pages.sort());
    expect(new Set(routeList.map((route) => route.path)).size).toBe(routeList.length);
  });

  it("keeps private and preview audiences explicit", () => {
    expect(appRoutes.invitation.audience).toBe("guest");
    expect(appRoutes.invitation.access).toBe("invitation");
    expect(appRoutes.pass.access).toBe("pass");
    expect(appRoutes.admin.access).toBe("admin");
    expect(appRoutes.adminSignIn.access).toBe("public");
    for (const route of routeList.filter((route) => route.path.startsWith("/dev"))) {
      expect(route.audience).toBe("dev");
      expect(route.access).toBe("preview");
    }
  });

  it("builds invitation paths without allowing token text to become a route or query", () => {
    expect(invitationHref("hello-world_123")).toBe("/i/hello-world_123");
    expect(invitationHref("one/two?next=/admin#part")).toBe(
      "/i/one%2Ftwo%3Fnext%3D%2Fadmin%23part",
    );
  });

  it("encodes pass credentials without creating invitation editing paths", () => {
    expect(passHref("signed.pass-value")).toBe("/p/signed.pass-value");
    expect(passHref("one/two?edit=/i/secret")).toBe("/p/one%2Ftwo%3Fedit%3D%2Fi%2Fsecret");
  });

  it("provides neutral samples for the complete accessibility route inventory", () => {
    expect(pageRouteSamples).toHaveLength(routeList.length);
    expect(pageRouteSamples).toContain("/i/invalid");
    expect(pageRouteSamples).toContain("/p/invalid");
    expect(pageRouteSamples.some((path) => path.includes("["))).toBe(false);
    expect(pageRouteSamples).toContain(appRoutes.admin.path);
  });
});
