package com.cognizant.sharecar.repository.specifications;

import com.cognizant.sharecar.common.spi.model.RideStatus;
import com.cognizant.sharecar.repository.entity.Ride;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

@Component
public class RideSpecifications {

    public Specification<Ride> ridesFilteredByStatus(RideStatus status) {
        return (Specification<Ride>) (root, query, cb) ->{
            if(status != null)
                return cb.equal(root.get("status"), status);
            else
                return cb.isNotNull(root.get("status"));
        };
    }

    public Specification<Ride> ridesFilteredByPassengerId(Long passengerId) {
        return (Specification<Ride>) (root, query, cb) ->{
            if(passengerId != null)
                return cb.equal(root.join("passenger").get("id"), passengerId);
            else
                return cb.isNotNull(root.get("passenger"));
        };
    }

    public Specification<Ride> ridesFilteredByTripId(Long tripId) {
        return (Specification<Ride>) (root, query, cb) ->{
            if(tripId != null)
                return cb.equal(root.join("trip").get("id"), tripId);
            else
                return cb.isNotNull(root.get("trip"));
        };
    }
}
