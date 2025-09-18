// src/pages/ExifMetadataPage.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonText,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";

interface TreeSubmission {
  [key: string]: any; // allow any keys for debugging
}

const ExifMetadataPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<TreeSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);

      // Fetch all columns with select("*") to avoid column mismatch
      const { data, error } = await supabase
        .from("tree_submissions")
        .select("*");

      // Log the response for debugging
      console.log("Supabase fetch result:", { data, error });

      if (error) {
        console.error("Error fetching submissions:", error.message);
        setLoading(false);
        return;
      }

      setSubmissions(data || []);
      setLoading(false);
    };

    fetchSubmissions();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Tree Submissions EXIF Debug</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {loading ? (
          <IonSpinner name="crescent" />
        ) : submissions.length === 0 ? (
          <IonText>No submissions found. Check RLS or table data.</IonText>
        ) : (
          submissions.map((submission, index) => (
            <IonCard key={submission.uuid || index}>
              <IonCardHeader>
                <IonCardTitle>
                  Submission {submission.submission_id || index} by User:{" "}
                  {submission.user_id || "Unknown"}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {submission.image_url ? (
                  <img
                    src={submission.image_url}
                    alt="Tree submission"
                    style={{
                      width: "100%",
                      borderRadius: "8px",
                      marginBottom: "10px",
                    }}
                  />
                ) : (
                  <p>No image available</p>
                )}
                <p><strong>Tree Type:</strong> {submission.tree_type || "N/A"}</p>
                <p><strong>Date Planted:</strong> {submission.date_planted || "N/A"}</p>
                <p><strong>Status:</strong> {submission.status || "N/A"}</p>
                <p><strong>Location:</strong> {submission.location_description || "N/A"}</p>
                <p><strong>Latitude:</strong> {submission.latitude || "N/A"}</p>
                <p><strong>Longitude:</strong> {submission.longitude || "N/A"}</p>
                <p><strong>Greenpoints:</strong> {submission.greenpoints || 0}</p>
                <p><strong>EXIF Metadata:</strong></p>
                <pre
                  style={{
                    background: "#f4f4f4",
                    padding: "10px",
                    borderRadius: "5px",
                    overflowX: "auto",
                  }}
                >
                  {submission.exif_metadata
                    ? JSON.stringify(submission.exif_metadata, null, 2)
                    : "No EXIF metadata"}
                </pre>

                <p><strong>Full Submission Data (Debug):</strong></p>
                <pre
                  style={{
                    background: "#e8e8e8",
                    padding: "10px",
                    borderRadius: "5px",
                    overflowX: "auto",
                  }}
                >
                  {JSON.stringify(submission, null, 2)}
                </pre>
              </IonCardContent>
            </IonCard>
          ))
        )}
      </IonContent>
    </IonPage>
  );
};

export default ExifMetadataPage;
