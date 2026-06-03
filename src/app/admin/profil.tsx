import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProfileScreenContent } from "@/components/profile/ProfileScreenContent";

export default function AdminProfilScreen() {
    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <ProfileScreenContent
                role="admin"
                title="Profil Admin"
                subtitle="Data akun bersifat baca-saja. Kamu hanya dapat mengubah password."
            />
        </ProtectedRoute>
    );
}
