import Welcome from "../components/Welcome";
import Nav from "../components/Nav";

import UserDashboard from "../components/UserDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import DeliveryBoy from "@/components/DeliveryBoy";
import EditRoleMobile from "@/components/EditRoleMobile";
import GeoUpdater from "@/components/GeoUpdater";


async function Home() {
    // TODO: Get user from session/context
    const user: any = null;
    const role = user?.role as string | undefined;
    const incomplete = user?.incomplete as boolean | undefined;

    if (role === "user" && incomplete) {
        return <EditRoleMobile />;
    }

    const plainUser = user ? JSON.parse(JSON.stringify(user)) : null;

    return (
        <>
            <Nav user={plainUser} />
            <GeoUpdater userId={plainUser?._id} />
            {plainUser?.role === "user" ? (
                <UserDashboard />
            ) : plainUser?.role === "admin" ? (
                <AdminDashboard />
            ) : (
                <DeliveryBoy />
            )}
        </>
    );
}

export default Home;