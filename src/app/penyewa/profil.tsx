import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProfileScreenContent } from "@/components/profile/ProfileScreenContent";

export default function PenyewaProfilScreen() {
    return (
        <ProtectedRoute allowedRoles={["penyewa"]}>
            <ProfileScreenContent
                role="penyewa"
                title="Profil Penyewa"
                subtitle="Data identitas dan sewa bersifat baca-saja. Kamu hanya dapat mengubah password."
            />
        </ProtectedRoute>
    );
}
